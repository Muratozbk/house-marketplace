import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";

function Contact() {
    const [message, setMessage] = useState('')
    const [Landlord, setLandlord] = useState(null)
    const [searchParams, setSearchParams] = useSearchParams()

    const params = useParams()

    return (
        <div>contact
        </div>
    );
}

export default Contact;