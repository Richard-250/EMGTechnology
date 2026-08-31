import{ar as c,ah as l,j as p,b9 as u,ad as d,ai as m}from"./index-DQAQBRBi.js";const h=d(`
    query Roles($options: RoleListOptions) {
        roles(options: $options) {
            items {
                id
                code
                description
            }
        }
    }
`);function q(o){const{value:t,onChange:i,multiple:a}=o,{_:s}=c(),{data:n}=l({queryKey:["roles"],queryFn:()=>m.query(h,{options:{take:100}}),select:e=>e.roles.items}),r=(n??[]).map(e=>({value:e.id,label:e.code,display:e.description?e.description:e.code}));return p.jsx(u,{value:t,onChange:i,multiple:a,items:r,placeholder:s({id:"h4pFju"}),searchPlaceholder:s({id:"jxxbqF"})})}export{q as R};
