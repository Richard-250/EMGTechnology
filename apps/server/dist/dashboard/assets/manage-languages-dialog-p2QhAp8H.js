import{ag as k,aP as A,aQ as Z,r as x,ah as _,aR as O,ay as h,ai as L,j as e,aS as I,aT as V,aU as X,aV as Y,aE as s,aW as z,aX as R,aY as y,aZ as N,a_ as B,aL as W,a$ as H,b0 as ee,b1 as ae,b2 as se,b3 as ne,b4 as te,b5 as le,aJ as F,ad as G}from"./index-DPPH9LZw.js";import{u as ie,L as J}from"./language-selector-05Al1XtR.js";const de=G(`
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
`);function xe({open:g,onClose:p}){const{activeChannel:$}=k(),{hasPermissions:i}=A(),u=Z(),t=$,j=i(["ReadSettings"])||i(["ReadGlobalSettings"]),f=i(["UpdateSettings"])||i(["UpdateGlobalSettings"]),D=i(["ReadChannel"]),c=i(["UpdateChannel"]),[d,U]=x.useState([]),[r,b]=x.useState([]),[o,m]=x.useState(""),C=ie(r||[]),{data:l,isLoading:w,error:P}=_({queryKey:["globalSettings","languages"],queryFn:()=>L.query(de),enabled:g&&j}),E=O({mutationFn:a=>L.mutate(re,{input:a}),onSuccess:()=>{u.invalidateQueries({queryKey:["globalSettings"]}),u.invalidateQueries({queryKey:["getServerConfig"]}),h.success("Global language settings updated successfully")},onError:a=>{h.error(`Failed to update global settings: ${a.message}`)}}),q=O({mutationFn:a=>L.mutate(oe,{input:a}),onSuccess:()=>{u.invalidateQueries({queryKey:["channels"]}),u.invalidateQueries({queryKey:["activeChannel"]}),h.success("Channel language settings updated successfully")},onError:a=>{h.error(`Failed to update channel settings: ${a.message}`)}});x.useEffect(()=>{g&&l&&U(l.globalSettings.availableLanguages||[]),g&&t&&(b(t.availableLanguageCodes||[]),m(t.defaultLanguageCode||""))},[g,l,t]);const Q=a=>{U(a);const n=r.filter(S=>a.includes(S));b(n),a.includes(o)||m(n[0]||"")},K=a=>{b(a),a.includes(o)||m(a[0]||"")},M=async()=>{const a=[];if(f&&l){const n=l.globalSettings.availableLanguages||[];JSON.stringify(n.sort())!==JSON.stringify(d.sort())&&a.push(E.mutateAsync({availableLanguages:d}))}if(c&&t){const n=t.availableLanguageCodes||[],S=t.defaultLanguageCode||"";(JSON.stringify(n.sort())!==JSON.stringify(r.sort())||S!==o)&&a.push(q.mutateAsync({id:t.id,availableLanguageCodes:r,defaultLanguageCode:o}))}try{await Promise.all(a),p()}catch{}},T=()=>{if(l&&f){const a=l.globalSettings.availableLanguages||[];if(JSON.stringify(a.sort())!==JSON.stringify(d.sort()))return!0}if(t&&c){const a=t.availableLanguageCodes||[],n=t.defaultLanguageCode||"";return JSON.stringify(a.sort())!==JSON.stringify(r.sort())||n!==o}return!1},v=E.isPending||q.isPending;return e.jsx(I,{open:g,onOpenChange:p,children:e.jsxs(V,{className:"max-w-2xl max-h-[80vh] overflow-y-auto",children:[e.jsxs(X,{children:[e.jsx(Y,{children:e.jsx(s,{id:"+KsEPl"})}),e.jsx(z,{children:e.jsx(s,{id:"TUn15d"})})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("h3",{className:"font-semibold",children:e.jsx(s,{id:"wCiE/8"})}),!j&&e.jsx(R,{className:"h-4 w-4 text-muted-foreground"})]}),j?w?e.jsx("div",{className:"text-sm text-muted-foreground",children:e.jsx(s,{id:"cZfFVY"})}):P?e.jsxs("div",{className:"flex items-center gap-2 p-3 bg-destructive/10 rounded-md",children:[e.jsx(y,{className:"h-4 w-4 text-destructive"}),e.jsx("span",{className:"text-sm text-destructive",children:e.jsx(s,{id:"tdu1lo"})})]}):e.jsxs("div",{className:"space-y-2",children:[e.jsx(N,{children:e.jsx(s,{id:"lZ1k+X"})}),e.jsx("div",{className:f?"":"pointer-events-none opacity-50",children:e.jsx(J,{value:d,onChange:Q,multiple:!0,availableLanguageCodes:B})}),e.jsx("p",{className:"text-xs text-muted-foreground",children:e.jsx(s,{id:"zYRRLp"})})]}):e.jsxs("div",{className:"flex items-center gap-2 p-3 bg-muted rounded-md",children:[e.jsx(y,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-muted-foreground",children:e.jsx(s,{id:"yJyG7D"})})]})]}),e.jsx(W,{}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsxs("h3",{className:"font-semibold",children:[e.jsx(s,{id:"bZmZc2"})," -"," ",e.jsx(H,{code:t?.code})]}),!D&&e.jsx(R,{className:"h-4 w-4 text-muted-foreground"})]}),D?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(N,{className:"text-sm font-medium",children:e.jsx(s,{id:"pLwWyo"})}),e.jsx("div",{className:c?"":"pointer-events-none opacity-50",children:e.jsx(J,{value:r,onChange:K,multiple:!0,availableLanguageCodes:d})}),d.length===0?e.jsx("p",{className:"text-xs text-muted-foreground",children:e.jsx(s,{id:"j2a7dU"})}):e.jsx("p",{className:"text-xs text-muted-foreground",children:e.jsx(s,{id:"F+Cfi2"})})]}),C.length>0&&e.jsxs("div",{children:[e.jsx(N,{className:"text-sm font-medium mb-2 block",children:e.jsx(s,{id:"TOFdm+"})}),e.jsxs(ee,{items:Object.fromEntries(C.map(({code:a,label:n})=>[a,`${n} (${a.toUpperCase()})`])),value:o,onValueChange:a=>{a!=null&&m(a)},disabled:!c,children:[e.jsx(ae,{className:"w-[200px]",children:e.jsx(se,{placeholder:"Select default language"})}),e.jsx(ne,{children:C.map(({code:a,label:n})=>e.jsxs(te,{value:a,children:[n," (",a.toUpperCase(),")"]},a))})]})]})]}):e.jsxs("div",{className:"flex items-center gap-2 p-3 bg-muted rounded-md",children:[e.jsx(y,{className:"h-4 w-4 text-muted-foreground"}),e.jsx("span",{className:"text-sm text-muted-foreground",children:e.jsx(s,{id:"eB+0qz"})})]})]})]}),e.jsxs(le,{children:[e.jsx(F,{variant:"outline",onClick:p,disabled:v,children:e.jsx(s,{id:"dEgA5A"})}),e.jsx(F,{onClick:M,disabled:!T()||v,children:v?e.jsx(s,{id:"XvjC4F"}):e.jsx(s,{id:"IUwGEM"})})]})]})})}export{xe as M};
