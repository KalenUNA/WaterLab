// Position-based fluid in world coordinates. No graphics or DOM dependencies.
// Fixed time steps keep gravity, pressure and moving-boundary response independent of FPS.
export class Fluid {
  constructor({capacity=3800, limit=2600, radius=.064, smoothing=.265}={}) {
    this.capacity=capacity; this.limit=limit; this.radius=radius; this.h=smoothing;
    this.count=0; this.emitted=0; this.drained=0; this.restDensity=2.55;
    for(const name of ['position','previous','velocity','gradient','delta']) this[name]=new Float32Array(capacity*3);
    for(const name of ['density','norm','lambda']) this[name]=new Float32Array(capacity);
    this.next=new Int32Array(capacity); this.heads=new Map();
    this.pairA=new Uint16Array(capacity*100);this.pairB=new Uint16Array(capacity*100);this.pairs=0;
  }
  clear(){this.count=0;this.emitted=0;this.drained=0;}
  add(x,y,z,vx=0,vy=0,vz=0){
    if(this.count>=this.limit || this.count>=this.capacity)return false;
    const i=this.count++*3;this.position.set([x,y,z],i);this.previous.set([x,y,z],i);this.velocity.set([vx,vy,vz],i);this.emitted++;return true;
  }
  seedVessel(){
    this.clear();const d=.131;
    for(let y=-.62;y<-.20;y+=d)for(let x=-.83;x<.84;x+=d)for(let z=-.83;z<.84;z+=d)
      if(x*x+z*z<.80*.80)this.add(x,y,z);
  }
  key(x,y,z){return ((x+128)&255)|(((y+128)&255)<<8)|(((z+128)&255)<<16);}
  buildPairs(){
    const p=this.position,h=this.h;this.heads.clear();this.pairs=0;
    for(let i=0;i<this.count;i++){const k=i*3,key=this.key(Math.floor(p[k]/h),Math.floor(p[k+1]/h),Math.floor(p[k+2]/h));this.next[i]=this.heads.get(key)??-1;this.heads.set(key,i);}
    const h2=h*h;
    for(let i=0;i<this.count;i++){
      const k=i*3,cx=Math.floor(p[k]/h),cy=Math.floor(p[k+1]/h),cz=Math.floor(p[k+2]/h);
      for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(let z=cz-1;z<=cz+1;z++){
        for(let j=this.heads.get(this.key(x,y,z))??-1;j!==-1;j=this.next[j]){
          if(j<=i)continue;const l=j*3,dx=p[k]-p[l],dy=p[k+1]-p[l+1],dz=p[k+2]-p[l+2],d2=dx*dx+dy*dy+dz*dz;
          if(d2<h2&&d2>1e-12&&this.pairs<this.pairA.length){this.pairA[this.pairs]=i;this.pairB[this.pairs++]=j;}
        }
      }
    }
  }
  step(dt,collider){
    if(!this.count)return;
    const n=this.count,p=this.position,old=this.previous,v=this.velocity,g=this.gradient,delta=this.delta,h=this.h,rho0=this.restDensity;
    old.set(p.subarray(0,n*3));
    for(let i=0;i<n;i++){const k=i*3;v[k+1]-=9.81*dt;for(let a=0;a<3;a++)p[k+a]+=v[k+a]*dt;collider?.resolve(p,k,old,this.radius);}
    this.buildPairs();
    for(let iteration=0;iteration<2;iteration++){
      this.density.fill(1,0,n);this.norm.fill(0,0,n);g.fill(0,0,n*3);delta.fill(0,0,n*3);
      for(let a=0;a<this.pairs;a++){
        const i=this.pairA[a],j=this.pairB[a],k=i*3,l=j*3;
        const dx=p[k]-p[l],dy=p[k+1]-p[l+1],dz=p[k+2]-p[l+2],d=Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(d>=h||d<1e-6)continue;const q=1-d/h,w=q*q*q,gs=-3*q*q/(h*rho0*d);
        this.density[i]+=w;this.density[j]+=w;
        const gx=gs*dx,gy=gs*dy,gz=gs*dz,gn=gx*gx+gy*gy+gz*gz;
        g[k]+=gx;g[k+1]+=gy;g[k+2]+=gz;g[l]-=gx;g[l+1]-=gy;g[l+2]-=gz;this.norm[i]+=gn;this.norm[j]+=gn;
      }
      for(let i=0;i<n;i++){const k=i*3;this.lambda[i]=-Math.max(this.density[i]/rho0-1,0)/(this.norm[i]+g[k]*g[k]+g[k+1]*g[k+1]+g[k+2]*g[k+2]+.05);}
      for(let a=0;a<this.pairs;a++){
        const i=this.pairA[a],j=this.pairB[a],k=i*3,l=j*3,dx=p[k]-p[l],dy=p[k+1]-p[l+1],dz=p[k+2]-p[l+2],d=Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(d>=h||d<1e-6)continue;const q=1-d/h;
        const tensile=-.00006*Math.pow(q*q*q/.343,4);
        const gs=(this.lambda[i]+this.lambda[j]+tensile)*(-3*q*q/(h*rho0*d));
        const cx=gs*dx,cy=gs*dy,cz=gs*dz;delta[k]+=cx;delta[k+1]+=cy;delta[k+2]+=cz;delta[l]-=cx;delta[l+1]-=cy;delta[l+2]-=cz;
      }
      for(let i=0;i<n;i++){const k=i*3,scale=Math.min(1,.045/(Math.hypot(delta[k],delta[k+1],delta[k+2])||1));for(let a=0;a<3;a++)p[k+a]+=delta[k+a]*scale;collider?.resolve(p,k,old,this.radius);}
    }
    for(let i=0;i<n;i++){
      const k=i*3;for(let a=0;a<3;a++)v[k+a]=(p[k+a]-old[k+a])/dt;
      const speed=Math.hypot(v[k],v[k+1],v[k+2]),scale=Math.min(1,18/(speed||1))*.999;
      for(let a=0;a<3;a++)v[k+a]*=scale;
    }
    // XSPH viscosity exchanges velocity between neighbours without attaching water to the model.
    delta.fill(0,0,n*3);
    for(let a=0;a<this.pairs;a++){
      const k=this.pairA[a]*3,l=this.pairB[a]*3,d=Math.hypot(p[k]-p[l],p[k+1]-p[l+1],p[k+2]-p[l+2]);
      if(d>=h)continue;const w=.022*(1-d/h)**3;
      for(let b=0;b<3;b++){const dv=(v[l+b]-v[k+b])*w;delta[k+b]+=dv;delta[l+b]-=dv;}
    }
    for(let i=0;i<n*3;i++)v[i]+=delta[i];
    for(let i=this.count-1;i>=0;i--){const k=i*3;if(!Number.isFinite(p[k]+p[k+1]+p[k+2])||p[k+1]<-4.4||Math.abs(p[k])>7||Math.abs(p[k+2])>7){
      const last=(--this.count)*3;for(let a=0;a<3;a++){p[k+a]=p[last+a];v[k+a]=v[last+a];}this.drained++;
    }}
  }
}
