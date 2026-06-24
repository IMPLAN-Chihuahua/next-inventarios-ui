"use client"


import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react";

export const AuthProvider = (props: any) => {
    return (
        <SessionProvider session={props.session}>
            {props.children}
        </SessionProvider>
    )
}


export default AuthProvider;