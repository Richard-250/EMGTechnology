import{af as c,r as n,ah as b,ar as m,j as L,b9 as p,ad as d,ai as f}from"./index-C0rQiKs_.js";function v(e){const{formatLanguageName:l}=c();return n.useMemo(()=>(e??[]).map(a=>({code:a,label:l(a)})).sort((a,s)=>a.label.localeCompare(s.label)),[e,l])}const h=d(`
    query AvailableGlobalLanguages {
        globalSettings {
            availableLanguages
        }
    }
`);function y(e){const{data:l}=b({queryKey:["availableGlobalLanguages"],queryFn:()=>f.query(h),staleTime:3e5}),{value:a,onChange:s,multiple:r,availableLanguageCodes:g}=e,{_:o}=m(),t=v(g??l?.globalSettings.availableLanguages??void 0),i=n.useMemo(()=>t.map(u=>({value:u.code,label:u.label})),[t]);return L.jsx(p,{value:a,onChange:s,multiple:r,items:i,placeholder:o({id:"ffxVQ8"}),searchPlaceholder:o({id:"StoBff"})})}export{y as L,v as u};
