import{aO as b,r as n,bh as c,u as m,j as L,bF as p,bo as d,bj as f}from"./index-CaiHHcHc.js";function v(e){const{formatLanguageName:l}=b();return n.useMemo(()=>(e??[]).map(a=>({code:a,label:l(a)})).sort((a,s)=>a.label.localeCompare(s.label)),[e,l])}const h=d(`
    query AvailableGlobalLanguages {
        globalSettings {
            availableLanguages
        }
    }
`);function y(e){const{data:l}=c({queryKey:["availableGlobalLanguages"],queryFn:()=>f.query(h),staleTime:3e5}),{value:a,onChange:s,multiple:r,availableLanguageCodes:g}=e,{_:o}=m(),t=v(g??l?.globalSettings.availableLanguages??void 0),i=n.useMemo(()=>t.map(u=>({value:u.code,label:u.label})),[t]);return L.jsx(p,{value:a,onChange:s,multiple:r,items:i,placeholder:o({id:"ffxVQ8"}),searchPlaceholder:o({id:"StoBff"})})}export{y as L,v as u};
