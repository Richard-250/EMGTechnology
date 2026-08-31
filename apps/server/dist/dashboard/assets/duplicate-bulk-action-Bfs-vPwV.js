import{bo as $,dN as I,r as x,bh as q,bC as F,j as e,b1 as P,aQ as R,aR as T,aS as B,T as l,aT as M,a_ as O,B as C,bj as b,cp as V,u as _,bi as N,dO as Q,t as v}from"./index-CaiHHcHc.js";import{D as U}from"./data-table-bulk-action-item-Bga3wpPl.js";import{g as Y,C as G}from"./configurable-operation-utils-BThAvAHW.js";const H=$(`
    mutation DuplicateEntity($input: DuplicateEntityInput!) {
        duplicateEntity(input: $input) {
            ... on DuplicateEntitySuccess {
                newEntityId
            }
            ... on ErrorResult {
                errorCode
                message
            }
            ... on DuplicateEntityError {
                duplicationError
            }
        }
    }
`),K=$(`
        query GetEntityDuplicators {
            entityDuplicators {
                code
                description
                requiresPermission
                forEntities
                args {
                    ...ConfigArgDefinition
                }
            }
        }
    `,[I]);function X({open:f,onOpenChange:d,entityType:y,entityName:i,duplicatorCode:m,onConfirm:r}){const[a,c]=x.useState(),{data:j}=q({queryKey:["entityDuplicators"],queryFn:()=>b.query(K),staleTime:1e3*60*60*5}),s=j?.entityDuplicators?.find(n=>n.code===m&&n.forEntities.includes(y));F.useEffect(()=>{s&&!a&&c({code:s.code,arguments:s.args?.map(n=>({name:n.name,value:Y(n)}))||[]})},[s,a]);const D=n=>{c(n)},h=()=>{a&&(r(a),d(!1),c(void 0))},p=()=>{d(!1),c(void 0)};return e.jsx(P,{open:f,onOpenChange:d,children:e.jsxs(R,{className:"sm:max-w-lg",children:[e.jsxs(T,{children:[e.jsx(B,{children:e.jsx(l,{id:"Lns7sP",values:{0:i.toLowerCase()}})}),e.jsx(M,{className:"sr-only",children:e.jsx(l,{id:"bX+LyM",values:{0:i.toLowerCase()}})})]}),e.jsxs("div",{className:"space-y-4",children:[a&&s&&e.jsx(G,{operationDefinition:s,value:a,onChange:D,removable:!1}),!s&&e.jsx("div",{className:"text-sm text-muted-foreground",children:e.jsx(l,{id:"B6LoY7",values:{duplicatorCode:m,entityName:i}})})]}),e.jsxs(O,{children:[e.jsx(C,{variant:"outline",onClick:p,children:e.jsx(l,{id:"dEgA5A"})}),e.jsx(C,{onClick:h,disabled:!a,children:e.jsx(l,{id:"euc6Ns"})})]})]})})}function Z({entityType:f,duplicatorCode:d,requiredPermissions:y,entityName:i,onSuccess:m,selection:r,table:a}){const{refetchPaginatedList:c}=V(),{_:j}=_(),[s,D]=x.useState(!1),[h,p]=x.useState({completed:0,total:0}),[n,E]=x.useState(!1),{mutateAsync:w}=N({mutationFn:b.mutate(H)}),L=()=>{s||E(!0)},S=async k=>{if(s)return;D(!0),p({completed:0,total:r.length});const t={success:0,failed:0,errors:[]};try{for(let o=0;o<r.length;o++){const g=r[o];try{const u=await w({input:{entityName:f,entityId:g.id,duplicatorInput:k}});if("newEntityId"in u.duplicateEntity)t.success++;else{t.failed++;const A=u.duplicateEntity.message||u.duplicateEntity.duplicationError||"Unknown error";t.errors.push(`${i} ${g.name||g.id}: ${A}`)}}catch(u){t.failed++,t.errors.push(`${i} ${g.name||g.id}: ${u instanceof Error?u.message:"Unknown error"}`)}p({completed:o+1,total:r.length})}if(t.success>0){const o=t.success;v.success(j({id:"YRTdLc",values:{count:o,entityName:i}}))}if(t.failed>0){const o=t.errors.length>3?`${t.errors.slice(0,3).join(", ")}... and ${t.errors.length-3} more`:t.errors.join(", ");v.error(`Failed to duplicate ${t.failed} ${i.toLowerCase()}s: ${o}`)}t.success>0&&(c(),a.resetRowSelection(),m?.())}finally{D(!1),p({completed:0,total:0})}};return e.jsxs(e.Fragment,{children:[e.jsx(U,{requiresPermission:y,onClick:L,label:s?e.jsx(l,{id:"+lpe0V",values:{0:h.completed,1:h.total}}):e.jsx(l,{id:"euc6Ns"}),icon:Q,closeOnClick:!1}),e.jsx(X,{open:n,onOpenChange:E,entityType:f,entityName:i,entities:r,duplicatorCode:d,onConfirm:S})]})}export{Z as D};
