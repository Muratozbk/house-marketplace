import { useState } from "react";
import { toast } from 'react-toastify'
import { Link, useNavigate } from "react-router-dom";
import { ReactComponent as ArrowRightIcon } from "../assets/svg/keyboardArrowRightIcon.svg";
import visibilityIcon from '../assets/svg/visibilityIcon.svg'
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import OAth from "../components/OAth";

function SignIn() {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const { email, password } = formData

    const navigate = useNavigate()

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.id]: e.target.value,
        }))
    }

    const onSubmit = async (e) => {
        e.preventDefault()

        try {
            const auth = getAuth()
            const userCredential = await signInWithEmailAndPassword(
                auth, email, password)

            if (userCredential.user) {
                navigate('/')
            }
        } catch (error) {
            toast.error('Bad User Credentials', { autoClose: 2000 })
            // toast('🦄 Wow so easy!', {
            //     position: "top-left",
            //     autoClose: 2000,
            //     closeOnClick: true,
            //     pauseOnHover: true,
            //     draggable: true,
            //     progress: undefined,
            //     theme: "light",
            // })
        }
    }

    return (
        <>
            <div className="pageContainer">
                <header>
                    <p className="pageHeader">Welcomne Back!</p>
                </header>
                <form onSubmit={onSubmit}>
                    <input type="email" className="emailInput" placeholder="Email" id="email"
                        value={email}
                        onChange={onChange} />

                    <div className="passwordInputDiv">
                        <input type={showPassword ? 'text' : 'password'}
                            className="passwordInput" placeholder="Password" value={password} id="password"
                            onChange={onChange} />

                        <img src={visibilityIcon} alt="show password"
                            className="showPassword"
                            onClick={(prevState) => !prevState} />
                    </div>

                    <Link to='/forgot-password' className="forgotPasswordLink">Forgot Password
                    </Link>
                    <div className="signInBar">
                        <p className="signInText">
                            Sign In
                        </p>
                        <button className="signInButton">
                            <ArrowRightIcon fill="#ffffff" width='34px' height='34px' />
                        </button>
                    </div>
                </form>

                <OAth />

                <Link to='/sign-up' className="registerLink">
                    Sign Up Instead
                </Link>
            </div>
        </>
    );
}

export default SignIn;