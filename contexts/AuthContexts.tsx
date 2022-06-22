import { createContext, useState, useEffect } from 'react';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import firebase from '../lib/firebase';
import { useRouter } from 'next/router'

type User = {
    id: number;
}

type SignInData = {
    phoneNumber: string
}

type AppContextInterface = {
    isAuthenticated: boolean;
    user: object | null;
    loading: boolean;
    signIn: (data: SignInData) => Promise<void>;
    // signOut: (data: SignOutData) => Promise<void>;
}

declare const window: any;


const AuthContext = createContext({} as AppContextInterface);

export function AuthProvider({ children }:any) {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const isAuthenticated = !!user;
   const auth = getAuth();
   const router = useRouter()
 
   useEffect(() => {
 
     window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
       'size': 'invisible',
       'callback': (response: any) => {
         // reCAPTCHA solved, allow signInWithPhoneNumber.
       }
     }, auth);
 
   },[])

  
   async function signIn({ phoneNumber }: SignInData) {
    try {
        setLoading(true);
        
        // var applicationVerifier = new firebase.auth.RecaptchaVerifier(window.recaptchaVerifier);
        // console.log(applicationVerifier)
        const appVerifier = window.recaptchaVerifier;

        return firebase
        .auth()
        .signInWithPhoneNumber(phoneNumber, appVerifier)
        .then((response) => {
            console.log(response);
        })
        
    } finally {
        setLoading(false);
        router.push('/dashboard')
    }

   }

//    async function signOut() {
//     try {
//         // Router.push('/');
//         setLoading(true);
//         return firebase
//         .auth()
//         .signOut()
//         .then(() => {
//             setUser(null);
//         })
//     } finally {
//         setLoading(false);
//     }
//    }

   return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, signIn }}>
        { children }
    </AuthContext.Provider>
   );
}

export const AuthConsumer = AuthContext.Consumer;

export default AuthContext;