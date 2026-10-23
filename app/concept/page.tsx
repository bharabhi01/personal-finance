import Dashboard from '@/components/Dashboard';
const initial=[
 {id:'1',date:'2026-10-13',amount_paise:18000,description:'Dosa',category:'Food',source:'whatsapp'},
 {id:'2',date:'2026-10-13',amount_paise:25000,description:'Cab',category:'Travel',source:'whatsapp'},
 {id:'3',date:'2026-10-12',amount_paise:9000,description:'Filter coffee',category:'Food',source:'app'},
 {id:'4',date:'2026-10-12',amount_paise:72000,description:'Dinner',category:'Food',source:'app'},
 {id:'5',date:'2026-10-11',amount_paise:120000,description:'Shoes',category:'Shopping',source:'app'},
 {id:'6',date:'2026-10-10',amount_paise:35000,description:'Fuel',category:'Travel',source:'app'},
];
export default function Concept(){return <Dashboard initial={initial} demo/>}
