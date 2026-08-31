import{d as k,H as A,J as Z,r as x,u as _,K as q,t as h,a as L,j as e,M as I,O as V,P as B,Q as X,T as s,U as Y,V as F,W as y,X as N,Y as z,S as H,Z as W,_ as ee,$ as ae,a0 as se,a1 as te,a2 as ne,a3 as le,B as J,g as G}from"./index-C9A49B9o.js";import{u as ie,L as R}from"./language-selector-Cjz9aLOP.js";const de=G(`
    query GlobalSettingsLanguages {
        globalSettings {
            id
            availableLanguages
        }
    }
`),re=G(`
    mutation UpdateGlobalSettingsLanguages($input: UpdateGlobalSettingsInput!) {
        updateGlobalSettings(input: $input) {
            __typename
            ... on GlobalSettings {
                id
                availableLanguages
            }
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`),oe=G(`
    mutation UpdateChannelLanguages($input: UpdateChannelInput!) {
        updateChannel(input: $input) {
            __typename
            ... on Channel {
                id
                code
                defaultLanguageCode
                availableLanguageCodes
            }
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`);function xe({open:g,onClose:p}){const{activeChannel:$}=k(),{hasPermissions:i}=A(),u=Z(),n=$,j=i(["ReadSettings"])||i(["ReadGlobalSettings"]),f=i(["UpdateSettings"])||i(["UpdateGlobalSettings"]),D=i(["ReadChannel"]),c=i(["UpdateChannel"]),[d,U]=x.useState([]),[r,C]=x.useState([]),[o,m]=x.useState(""),b=ie(r||[]),{data:l,isLoading:w,error:K}=_({queryKey:["globalSettings","languages"],queryFn:()=>L.query(de),enabled:g&&j}),E=q({mutationFn:a=>L.mutate(re,{input:a}),onSuccess:()=>{u.invalidateQueries({queryKey:["globalSettings"]}),u.invalidateQueries({queryKey:["getServerConfig"]}),h.success("Global language settings updated successfully")},onError:a=>{h.error(`Failed to update global settings: ${a.message}`)}}),O=q({mutationFn:a=>L.mutate(oe,{input:a}),onSuccess:()=>{u.invalidateQueries({queryKey:["channels"]}),u.invalidateQueries({queryKey:["activeChannel"]}),h.success("Channel language settings updated successfully")},onError:a=>{h.error(`Failed to update channel settings: ${a.message}`)}});x.useEffect(()=>{g&&l&&U(l.globalSettings.availableLanguages||[]),g&&n&&(C(n.availableLanguageCodes||[]),m(n.defaultLanguageCode||""))},[g,l,n]);const M=a=>{U(a);const t=r.filter(S=>a.includes(S));C(t),a.includes(o)||m(t[0]||"")},P=a=>{C(a),a.includes(o)||m(a[0]||"")},Q=async()=>{const a=[];if(f&&l){const t=l.globalSettings.availableLanguages||[];JSON.stringify(t.sort())!==JSON.stringify(d.sort())&&a.push(E.mutateAsync({availableLanguages:d}))}if(c&&n){const t=n.availableLanguageCodes||[],S=n.defaultLanguageCode||"";(JSON.stringify(t.sort())!==JSON.stringify(r.sort())||S!==o)&&a.push(O.mutateAsync({id:n.id,availableLanguageCodes:r,defaultLanguageCode:o}))}try{await Promise.all(a),p()}catch{}},T=()=>{if(l&&f){const a=l.globalSettings.availableLanguages||[];if(JSON.stringify(a.sort())!==JSON.stringify(d.sort()))return!0}if(n&&c){const a=n.availableLanguageCodes||[],t=n.defaultLanguageCode||"";return JSON.stringify(a.sort())!==JSON.stringify(r.sort())||t!==o}return!1},v=E.isPending||O.isPending;return e.jsx(I,{open:g,onOpenChange:p,children:e.jsxs(V,{className:"max-w-2xl max-h-[80vh] overflow-y-auto",children:[e.jsxs(B,{children:[e.jsx(X,{children:e.jsx(s,{id:"+KsEPl"})}),e.jsx(Y,{children:e.jsx(s,{id:"TUn15d"})})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("h3",{className:"font-semibold",children:e.jsx(s,{id:"wCiE/8"})}),!j&&e.jsx(F,{className:"h-4 w-4 text-muted-foreground"})]}),j?w?e.jsx("div",{className:"text-sm text-muted-foreground",children:e.jsx(s,{id:"cZfFVY"})}):K?e.jsxs("div",{className:"flex items-center gap-2 p-3 bg-destructive/10 rounded-md",children:[e.jsx(y,{className:"h-4 w-4 text-destructive"}),e.jsx("span",{className:"text-sm text-destructive",children:e.jsx(s,{id:"tdu1lo"})})]}):e.jsxs("div",{className:"space-y-2",children:[e.jsx(N,{children:e.jsx(s,{id:"lZ1k+X"})}),e.jsx("div",{className:f?"":"pointer-events-none opacity-50",children:e.jsx(R,{value:d,onChange:M,multiple:!0,availableLanguageCodes:z})}),e.jsx("p",{className:"text-xs text-muted-foreground",children:e.jsx(s,{id:"zYRRLp"})})]}):e.jsxs("div",{className:"flex items-center gap-2 p-3 bg-muted rounded-md",children:[e.jsx(y,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-muted-foreground",children:e.jsx(s,{id:"yJyG7D"})})]})]}),e.jsx(H,{}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsxs("h3",{className:"font-semibold",children:[e.jsx(s,{id:"bZmZc2"})," -"," ",e.jsx(W,{code:n?.code})]}),!D&&e.jsx(F,{className:"h-4 w-4 text-muted-foreground"})]}),D?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(N,{className:"text-sm font-medium",children:e.jsx(s,{id:"pLwWyo"})}),e.jsx("div",{className:c?"":"pointer-events-none opacity-50",children:e.jsx(R,{value:r,onChange:P,multiple:!0,availableLanguageCodes:d})}),d.length===0?e.jsx("p",{className:"text-xs text-muted-foreground",children:e.jsx(s,{id:"j2a7dU"})}):e.jsx("p",{className:"text-xs text-muted-foreground",children:e.jsx(s,{id:"F+Cfi2"})})]}),b.length>0&&e.jsxs("div",{children:[e.jsx(N,{className:"text-sm font-medium mb-2 block",children:e.jsx(s,{id:"TOFdm+"})}),e.jsxs(ee,{items:Object.fromEntries(b.map(({code:a,label:t})=>[a,`${t} (${a.toUpperCase()})`])),value:o,onValueChange:a=>{a!=null&&m(a)},disabled:!c,children:[e.jsx(ae,{className:"w-[200px]",children:e.jsx(se,{placeholder:"Select default language"})}),e.jsx(te,{children:b.map(({code:a,label:t})=>e.jsxs(ne,{value:a,children:[t," (",a.toUpperCase(),")"]},a))})]})]})]}):e.jsxs("div",{className:"flex items-center gap-2 p-3 bg-muted rounded-md",children:[e.jsx(y,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-muted-foreground",children:e.jsx(s,{id:"eB+0qz"})})]})]})]}),e.jsxs(le,{children:[e.jsx(J,{variant:"outline",onClick:p,disabled:v,children:e.jsx(s,{id:"dEgA5A"})}),e.jsx(J,{onClick:Q,disabled:!T()||v,children:v?e.jsx(s,{id:"XvjC4F"}):e.jsx(s,{id:"IUwGEM"})})]})]})})}export{xe as M};
