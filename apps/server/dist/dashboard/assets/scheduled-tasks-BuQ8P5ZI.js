import{aq as S,ar as R,ag as D,aQ as E,aR as o,ah as t,ay as h,ae as b,ai as e,cF as f,e8 as n,aE as a,aJ as x,cN as A,cO as q,ed as M,cP as v,cT as m,dy as C,dz as P,dC as L,dD as Q,dQ as N,ac as c,ea as z}from"./index-BzqLKldm.js";import{P as I}from"./payload-dialog-CEXVeD9a.js";const J=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polygon",{points:"10 8 16 12 10 16 10 8",key:"1cimsy"}]],F=S("CirclePlay",J),K=c(`
    query ScheduledTasks {
        scheduledTasks {
            id
            description
            schedule
            scheduleDescription
            lastExecutedAt
            nextExecutionAt
            isRunning
            lastResult
            enabled
        }
    }
`),O=c(`
    mutation UpdateScheduledTask($input: UpdateScheduledTaskInput!) {
        updateScheduledTask(input: $input) {
            id
            enabled
        }
    }
`),U=c(`
    mutation RunScheduledTask($id: String!) {
        runScheduledTask(id: $id) {
            success
        }
    }
`);function _(){const{_:i}=R(),{data:l}=D({queryKey:["scheduledTasks"],queryFn:()=>t.query(K)}),r=E(),{mutate:p}=o({mutationFn:t.mutate(O),onSuccess:s=>{u()}}),u=()=>{r.invalidateQueries({queryKey:["scheduledTasks"]})},{mutate:j}=o({mutationFn:t.mutate(U),onSuccess:s=>{s.runScheduledTask.success?(h.success(i({id:"96xJ48"})),r.invalidateQueries({queryKey:["scheduledTasks"]})):h.error(i({id:"DzhRjJ"}))}}),{formatDate:g,formatRelativeDate:y}=b(),k={year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"},d=z(),T=[d.accessor("id",{header:i({id:"S0kLOH"}),cell:({getValue:s})=>e.jsx(f,{value:s(),children:e.jsx("span",{className:"font-mono",children:s()})})}),d.accessor("description",{header:i({id:"Nu4oKW"})}),d.accessor("enabled",{header:i({id:"RxzN1M"}),cell:({row:s})=>s.original.enabled?e.jsx(n,{variant:"success",children:e.jsx(a,{id:"RxzN1M"})}):e.jsx(n,{variant:"secondary",children:e.jsx(a,{id:"E/QGRL"})})}),d.accessor("schedule",{header:i({id:"pIxz4h"})}),d.accessor("scheduleDescription",{header:i({id:"gmB6oO"})}),d.accessor("lastExecutedAt",{header:i({id:"RhpMfE"}),cell:({row:s})=>s.original.lastExecutedAt?e.jsx("div",{title:s.original.lastExecutedAt,children:y(s.original.lastExecutedAt)}):e.jsx(a,{id:"qqeAJM"})}),d.accessor("nextExecutionAt",{header:i({id:"WwKMiy"}),cell:({row:s})=>s.original.nextExecutionAt?g(s.original.nextExecutionAt,k):e.jsx(a,{id:"qqeAJM"})}),d.accessor("isRunning",{header:i({id:"RiQMUh"}),cell:({row:s})=>s.original.isRunning?e.jsx(n,{variant:"success",children:e.jsx(a,{id:"RiQMUh"})}):e.jsx(n,{variant:"secondary",children:e.jsx(a,{id:"LXcUnJ"})})}),d.accessor("lastResult",{header:i({id:"ikhZzI"}),cell:({row:s})=>s.original.lastResult?e.jsx(I,{payload:s.original.lastResult,title:e.jsx(a,{id:"bDEHSp"}),description:e.jsx(a,{id:"swNxZp"}),trigger:e.jsx(x,{size:"sm",variant:"secondary",children:e.jsx(a,{id:"xwytAA"})})}):e.jsx("div",{className:"text-muted-foreground",children:e.jsx(a,{id:"YTKVwL"})})}),d.display({id:"actions",header:i({id:"7L01XJ"}),cell:({row:s})=>e.jsxs(A,{children:[e.jsx(q,{render:e.jsx(x,{variant:"ghost",size:"icon"}),children:e.jsx(M,{})}),e.jsxs(v,{children:[s.original.enabled&&e.jsxs(m,{onClick:()=>j({id:s.original.id}),children:[e.jsx(F,{className:"w-4 h-4"}),e.jsx(a,{id:"3JjdaA"})]}),e.jsx(m,{onClick:()=>p({input:{id:s.original.id,enabled:!s.original.enabled}}),children:s.original.enabled?e.jsx(a,{id:"cO9+2L"}):e.jsx(a,{id:"PaQ3df"})})]})]})})];return e.jsxs(C,{pageId:"scheduled-tasks-list",children:[e.jsx(P,{children:e.jsx(a,{id:"8OiyFS"})}),e.jsx(L,{children:e.jsx(Q,{blockId:"list-table",children:e.jsx(N,{onRefresh:u,columns:T,data:l?.scheduledTasks??[],totalItems:l?.scheduledTasks?.length??0,defaultColumnVisibility:{schedule:!1}})})})]})}export{_ as component};
