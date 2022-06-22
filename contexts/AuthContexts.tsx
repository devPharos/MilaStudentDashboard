import { createContext, useState, useEffect } from 'react';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import { getDoc, doc, setDoc } from "firebase/firestore";
import Router from 'next/router'
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import firebase from '../lib/firebase';

type User = {
    uid: string,
    name: string | null,
    phone: string | null
}

type SignInData = {
    phoneNumber: string
}

type CodeData = {
    codeNumber: string;
}

type AppContextInterface = {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    signIn: (data: SignInData) => Promise<void>;
    confirm: (data: CodeData) => Promise<void>;
    isCodeSent: boolean;
    signOut: () => Promise<void>;
}

declare const window: any;


const AuthContext = createContext({} as AppContextInterface);

export function AuthProvider({ children }:any) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const isAuthenticated = !!user;
    const auth = getAuth();
    
    const userCollection = firebase.firestore().collection("users");

    firebase.auth().useDeviceLanguage();
    
    useEffect(() => {
        
        window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
            console.log(response);
            // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
        }, auth);
    
    },[])

    useEffect(() => {
        const { 'mila-token': token } = parseCookies();

        if(token) {
            retUser({ name: null, phone: null, uid: token});
        }
    },[])

    useEffect(() => {
        console.log({ user })
        if(user) {
            setCookie(undefined, 'mila-token',user.uid, {
                maxAge: 60 * 60 * 24 // 24 hours
            })
            Router.push("/dashboard");
        } else {
            Router.push("/");
        }
    },[user])

  
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
                window.confirmationResult = response;
                setIsCodeSent(true);
                setLoading(false);
                // router.push('/dashboard')
            }).catch((error) => {
                // Error; SMS not sent
                // ...
                console.log(error)
            });
            
        } finally {
        }

    }

    async function retUser({ uid }: User) {
        const docRef = doc(userCollection, uid);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            const data = docSnap.data();
            setUser({ uid, name: data.name, phone: data.phone});
        }

    }

   async function confirm({ codeNumber }: CodeData) {
        try {
            setLoading(true);
            window.confirmationResult.confirm(codeNumber).then(async (result: any) => {
                // User signed in successfully.
                const uid = result.user.uid;
                var credential = firebase.auth.PhoneAuthProvider.credential(window.confirmationResult.verificationId, codeNumber);
                firebase.auth().signInWithCredential(credential);

                await retUser(result.user);

                setLoading(false);

                // ...
            }).catch((error: any) => {
                // User couldn't sign in (bad verification code?)
                // ...
            console.log(error)
            });
        } finally {
        }
    }

   async function signOut() {
    try {
        setLoading(true);
        return firebase
        .auth()
        .signOut()
        .then(() => {
            Router.push("/");
            destroyCookie(undefined, 'mila-token');
            setUser(null);
            setLoading(false);
        })
    } finally {
    }
   }

   return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, signIn, signOut, confirm, isCodeSent }}>
        { children }
    </AuthContext.Provider>
   );
}

export const AuthConsumer = AuthContext.Consumer;

export default AuthContext;