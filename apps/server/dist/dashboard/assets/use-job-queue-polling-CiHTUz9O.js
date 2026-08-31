import{r,ah as m,ad as E,ai as A}from"./index-bt3yEGjf.js";const L=5e3,T=3e4,P=500,_=4e3,O="job-queue-polling:",h=E(`
    query JobListForPolling($options: JobListOptions) {
        jobs(options: $options) {
            items {
                id
                createdAt
                state
            }
            totalItems
        }
    }
`),g=t=>`${O}${t}`,y=t=>{try{const n=sessionStorage.getItem(g(t));if(n)return JSON.parse(n)}catch{}return null},D=(t,n)=>sessionStorage.setItem(g(t),JSON.stringify(n)),f=t=>sessionStorage.removeItem(g(t));function w(t,n){const[l,a]=r.useState(!1),[R,S]=r.useState(0),o=r.useRef(null),s=r.useRef(null),u=r.useRef(n),I=r.useRef(!1);r.useEffect(()=>{u.current=n},[n]),r.useEffect(()=>{if(I.current)return;I.current=!0;const e=y(t);if(e&&Date.now()<e.expiresAt){o.current=e.startTime,S(0),a(!0);const c=e.expiresAt-Date.now();s.current=setTimeout(()=>{a(!1),o.current=null,f(t),u.current()},c)}else e&&f(t)},[t]);const d=l?Math.min(P*Math.pow(1.75,R),_):!1,{data:p}=m({queryKey:["jobQueuePolling",t],queryFn:()=>(S(e=>e+1),A.query(h,{options:{filter:{queueName:{eq:t}},sort:{createdAt:"DESC"},take:10}})),enabled:l,refetchInterval:d});r.useEffect(()=>{const e=o.current;if(!l||!e)return;const c=p?.jobs.items.filter(i=>i.createdAt>=e)??[];c.length>0&&c.every(i=>i.state!=="PENDING"&&i.state!=="RUNNING"&&i.state!=="RETRYING")&&(a(!1),o.current=null,f(t),s.current&&(clearTimeout(s.current),s.current=null),u.current())},[p,l,t]),r.useEffect(()=>()=>{s.current&&clearTimeout(s.current)},[]);const b=r.useCallback(()=>{s.current&&clearTimeout(s.current);const e=new Date(Date.now()-L).toISOString(),c=Date.now()+T;D(t,{startTime:e,expiresAt:c}),o.current=e,S(0),a(!0),s.current=setTimeout(()=>{a(!1),o.current=null,f(t),u.current()},T)},[t]);return{isPolling:l,startPolling:b}}export{w as u};
