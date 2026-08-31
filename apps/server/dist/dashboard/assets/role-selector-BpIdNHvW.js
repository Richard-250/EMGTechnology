import{l as c,u as r,j as p,a7 as u,g as d,a as m}from"./index-CXKWWRpm.js";const y=d(`
    query Roles($options: RoleListOptions) {
        roles(options: $options) {
            items {
                id
                code
                description
            }
        }
    }
`);function q(o){const{value:t,onChange:i,multiple:a}=o,{_:s}=c(),{data:n}=r({queryKey:["roles"],queryFn:()=>m.query(y,{options:{take:100}}),select:e=>e.roles.items}),l=(n??[]).map(e=>({value:e.id,label:e.code,display:e.description?e.description:e.code}));return p.jsx(u,{value:t,onChange:i,multiple:a,items:l,placeholder:s({id:"h4pFju"}),searchPlaceholder:s({id:"jxxbqF"})})}export{q as R};
