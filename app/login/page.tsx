import {redirect} from 'next/navigation';
import {isDev} from '@/lib/server';
import LoginForm from '@/components/LoginForm';
export default function Login(){
 if(isDev)redirect('/');
 return <LoginForm/>;
}
