import './style.css';
export const metadata={title:'Expense tracker',description:'Your private expense tracker'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
