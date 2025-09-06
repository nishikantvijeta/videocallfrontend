import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
export default function LandingPage() {

    const router = useNavigate();

    return (
        <div className="w-screen h-screen bg-cover bg-no-repeat text-white" style={{ backgroundImage: 'url("/background.png")' }}>
            <nav className="flex justify-between items-center px-6 py-8">
                <h2 className="text-2xl font-bold">Virtual Video Call</h2>
                <div className="flex gap-8 cursor-pointer items-center">
                    <p onClick={() => router("/aljk23")} className="hover:text-orange-400 transition">Join as Guest</p>
                    <p onClick={() => router("/auth")} className="hover:text-orange-400 transition">Register</p>
                    <div onClick={() => router("/auth")} role="button" className="bg-orange-600 px-4 py-2 rounded-xl hover:bg-orange-700 transition">
                        <p>Login</p>
                    </div>
                </div>
            </nav>

            <div className="flex justify-between items-center px-12 h-[80vh]">
                <div className="text-3xl font-semibold">
                    <span className="text-orange-400">Connect</span> with friends and family anytime.
                    <p className="mt-4 text-lg font-normal">Bridge the distance with Virtual Video Call</p>
                    <div role="button" className="bg-orange-600 px-6 py-3 rounded-2xl mt-8 w-fit hover:bg-orange-700 transition">
                        <Link to={"/auth"} className="text-white text-xl no-underline">Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/meetp.jpg" alt="" className="h-[70vh] w-auto rounded-2xl shadow-lg" />
                </div>
            </div>
        </div>
    )
}
