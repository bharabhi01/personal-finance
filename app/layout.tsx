import './style.css';
import {SpeedInsights} from '@vercel/speed-insights/next';
export const metadata={title:'Expense tracker',description:'Your private expense tracker'};
const theme=`document.documentElement.dataset.theme=localStorage.getItem('theme')||'dark'`;
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:theme}} /></head><body>{children}<SpeedInsights/></body></html>}
