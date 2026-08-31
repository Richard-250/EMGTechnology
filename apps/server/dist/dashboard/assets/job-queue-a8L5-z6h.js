import{k as S,g as j,cP as M,K as A,t as x,db as v,a as b,j as e,T as s,r as f,l as P,c as T,dc as J,dd as F,de as q,cy as B,bL as N,bM as I,df as w,dg as G,B as g,bN as y,bR as R,d5 as Q,dh as $}from"./index-CXKWWRpm.js";import{L as O}from"./list-page-Cpdd_Oqx.js";import{D as z}from"./data-table-bulk-action-item-D3mU564C.js";import{B as p,C as _,R as V}from"./rotate-ccw-Dcb5_REC.js";import{P as D}from"./payload-dialog-DoQDiHdd.js";const U=[["path",{d:"M12 2v4",key:"3427ic"}],["path",{d:"m16.2 7.8 2.9-2.9",key:"r700ao"}],["path",{d:"M18 12h4",key:"wj9ykh"}],["path",{d:"m16.2 16.2 2.9 2.9",key:"1bxg5t"}],["path",{d:"M12 18v4",key:"jadmvz"}],["path",{d:"m4.9 19.1 2.9-2.9",key:"bwix9q"}],["path",{d:"M2 12h4",key:"j09sii"}],["path",{d:"m4.9 4.9 2.9 2.9",key:"giyufr"}]],Y=S("Loader",U),L=j(`
    fragment JobInfo on Job {
        id
        queueName
        createdAt
        startedAt
        settledAt
        state
        isSettled
        progress
        duration
        data
        result
        error
        retries
        attempts
    }
`),H=j(`
        query JobList($options: JobListOptions) {
            jobs(options: $options) {
                items {
                    ...JobInfo
                }
                totalItems
            }
        }
    `,[L]),K=j(`
    query JobQueueList {
        jobQueues {
            name
            running
        }
    }
`),k=j(`
        mutation CancelJob($jobId: ID!) {
            cancelJob(jobId: $jobId) {
                ...JobInfo
            }
        }
    `,[L]),Z=({selection:r,table:o})=>{const{refetchPaginatedList:u}=M(),a=r.filter(t=>t.state==="RUNNING"||t.state==="PENDING"),l=a.length,{mutate:n,isPending:h}=A({mutationFn:async()=>{const t=await Promise.allSettled(a.map(c=>b.mutate(k,{jobId:c.id}))),i=t.filter(c=>c.status==="fulfilled").length,m=t.filter(c=>c.status==="rejected").length;return{fulfilled:i,rejected:m}},onSuccess:({fulfilled:t,rejected:i})=>{t>0&&x.success(v._({id:"11pDnY",values:{fulfilled:t}})),i>0&&x.error(v._({id:"ccWF12",values:{rejected:i}})),u(),o.resetRowSelection()}});return l===0?null:e.jsx(z,{requiresPermission:["DeleteSettings","DeleteSystem"],onClick:()=>n(),disabled:h,label:e.jsx(s,{id:"BQ46c7",values:{cancellableCount:l}}),confirmationText:e.jsx(s,{id:"wTQAyT",values:{cancellableCount:l}}),icon:p,className:"text-destructive"})};function X(r){if(r<1e3)return`${r}ms`;const o=Math.floor(r/1e3),u=Math.floor(o/60),a=Math.floor(u/60),l=Math.floor(a/24),n=[];return l>0&&n.push(`${l}d`),a%24>0&&n.push(`${a%24}h`),u%60>0&&n.push(`${u%60}m`),o%60>0&&n.push(`${o%60}s`),n.join(" ")}function W(r){switch(r){case"PENDING":case"RETRYING":return"warning";case"COMPLETED":return"success";case"FAILED":case"CANCELLED":return"destructive";default:return"secondary"}}const C=[{label:"Pending",value:"PENDING",icon:J},{label:"Completed",value:"COMPLETED",icon:F},{label:"Running",value:"RUNNING",icon:Y},{label:"Failed",value:"FAILED",icon:_},{label:"Retrying",value:"RETRYING",icon:V},{label:"Cancelled",value:"CANCELLED",icon:p}],E=[{label:e.jsx(s,{id:"az8lvo"}),value:0},{label:e.jsx(s,{id:"a5xvsE"}),value:5e3},{label:e.jsx(s,{id:"UFvKgT"}),value:1e4},{label:e.jsx(s,{id:"hYZ3aH"}),value:3e4},{label:e.jsx(s,{id:"rjE0f3"}),value:6e4}];function ie(){const r=f.useRef(()=>{}),{_:o}=P(),{formatRelativeDate:u}=T(),[a,l]=f.useState(1e4),n=f.useRef(!1);f.useEffect(()=>{if(a===0)return;const t=setInterval(()=>{n.current||r.current()},a);return()=>clearInterval(t)},[a]);const h=E.find(t=>t.value===a);return e.jsx(O,{pageId:"job-queue-list",title:e.jsx(s,{id:"AsRAnH"}),defaultSort:[{id:"createdAt",desc:!0}],listQuery:H,route:q,customizeColumns:{createdAt:{cell:({row:t})=>e.jsx("div",{title:t.original.createdAt,children:u(t.original.createdAt)})},data:{cell:({row:t})=>e.jsx(D,{payload:t.original.data,title:e.jsx(s,{id:"XBRZ0Q"}),onOpenChange:i=>n.current=i,description:e.jsx(s,{id:"6V+g40"}),trigger:e.jsx(g,{size:"sm",variant:"secondary",children:e.jsx(s,{id:"gqSqrj"})})})},queueName:{cell:({row:t})=>e.jsx("span",{className:"font-mono",children:t.original.queueName})},result:{cell:({row:t})=>t.original.result?e.jsx(D,{payload:t.original.result,title:e.jsx(s,{id:"bDEHSp"}),onOpenChange:i=>n.current=i,description:e.jsx(s,{id:"swNxZp"}),trigger:e.jsx(g,{size:"sm",variant:"secondary",children:e.jsx(s,{id:"xwytAA"})})}):e.jsx("div",{className:"text-muted-foreground",children:e.jsx(s,{id:"YTKVwL"})})},state:{cell:({row:t,table:i})=>{const m=A({mutationFn:d=>b.mutate(k,{jobId:d}),onSuccess:()=>{r.current()}}),c=C.find(d=>d.value===t.original.state);return e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(Q,{variant:W(t.original.state),children:[c&&e.jsx(c.icon,{className:t.original.state==="RUNNING"?"animate-spin":void 0}),t.original.state]}),t.original.state==="RUNNING"&&e.jsxs(N,{onOpenChange:d=>n.current=d,children:[e.jsx(I,{render:e.jsx(g,{variant:"ghost",size:"icon-xs"}),children:e.jsx($,{})}),e.jsx(y,{align:"end",children:e.jsxs(R,{onClick:()=>m.mutate(t.original.id),disabled:m.isPending,className:"text-destructive focus:text-destructive",children:[e.jsx(p,{}),e.jsx(s,{id:"FnSb+y"})]})})]})]})}},duration:{cell:({row:t})=>t.original.duration?X(t.original.duration):null}},defaultVisibility:{isSettled:!1,settledAt:!1,progress:!1,retries:!1,attempts:!1,error:!1,startedAt:!1},facetedFilters:{queueName:{title:o({id:"b24kPi"}),optionsFn:async()=>b.query(K).then(t=>t.jobQueues.map(i=>({label:i.name,value:i.name})))},state:{title:o({id:"RS0o7b"}),options:C}},bulkActions:[{component:Z,order:100}],registerRefresher:t=>{r.current=t},children:e.jsx(B,{itemId:"auto-refresh-button",children:e.jsxs(N,{children:[e.jsxs(I,{render:e.jsx(g,{variant:"outline",size:"sm",className:"gap-2"}),children:[e.jsx(w,{className:"h-4 w-4"}),e.jsx("span",{children:e.jsx(s,{id:"0OgmBr",values:{0:h?.label}})}),e.jsx(G,{className:"h-4 w-4"})]}),e.jsx(y,{align:"end",children:E.map(t=>e.jsx(R,{onClick:()=>l(t.value),className:a===t.value?"bg-accent":"",children:t.label},t.value))})]})})})}export{ie as component};
