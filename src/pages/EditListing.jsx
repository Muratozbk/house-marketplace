import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase.config'
import {
    doc, getDoc, updateDoc, addDoc,
    collection, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid'
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";

function EditListing() {
    const [loading, setLoading] = useState(false)
    const [geolocationEnabled, setGeolocationEnabled] = useState(true)
    const [listing, setListing] = useState(false)
    const [formData, setFormData] = useState({
        type: 'rent',
        name: '',
        bedrooms: 1,
        bathrooms: 1,
        parking: false,
        furnished: false,
        address: '',
        offer: false,
        regularPrice: 0,
        discountedPrice: 0,
        images: {},
        latitude: 0,
        longitude: 0
    })

    const { type, name, bedrooms, bathrooms, furnished, address
        , offer, regularPrice, discountedPrice, images,
        latitude, longitude, parking } = formData


    const auth = getAuth()
    const params = useParams()
    const navigate = useNavigate()
    const isMounted = useRef(true)

    // Fetch Listing to Edit
    useEffect(() => {
        setListing(true)
        const fetchListing = async () => {
            const docRef = doc(db, 'listings', params.listingId)
            const docSnap = await getDoc(docRef)
            console.log(docSnap.data())
            if (docSnap.exists()) {
                setListing(docSnap.data())
                setFormData({
                    ...docSnap.data(),
                    address: docSnap.data().location
                })
                setLoading(false)
            } else {
                navigate('/')
                toast.error('Listing does not exist')
            }
        }

        fetchListing()
    }, [navigate, params.listingId])

    // Sets userRef to logged in user
    useEffect(() => {
        if (isMounted.current) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    setFormData({ ...formData, userRef: user.uid })
                } else {
                    navigate('/sign-in')
                }
            })
        }
        const unsubscribe = onSnapshot(collection(db, 'listings'), (snapshot) => {
            const fetchedData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Update your state or do something with the fetched data
            console.log(fetchedData);
        });

        return () => {
            isMounted.current = false
            unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // }, [isMounted])
    }, [auth, navigate, formData])

    ////----- On Submit ---------////
    const onSubmit = async e => {
        e.preventDefault()
        setLoading(true)

        console.log(formData)
        if (discountedPrice >= regularPrice) {
            setLoading(false)
            toast.error('Discounted price need to be less than regular price')
            return
        }
        if (images.length > 6) {
            setLoading(false)
            toast.error('Max 6 images')
            return
        }

        let geolocation = {}
        let location = {}

        if (geolocationEnabled) {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`)

            const data = await response.json()
            console.log(data)

            geolocation.lat = data.results[0]?.geometry.location.lat ?? 0
            geolocation.lng = data.results[0]?.geometry.location.lng ?? 0

            location = data.status === 'ZERO_RESULTS' ? undefined :
                data.results[0]?.formatted_address

            if (location === undefined || location.includes('undefined')) {
                setLoading(false)
                toast.error('Please enter a correct address')
                return
            }
        } else {
            geolocation.lat = latitude
            geolocation.lng = longitude
        }

        // Store image in firebase
        const storeImage = async (image) => {
            return new Promise((resolve, reject) => {
                const storage = getStorage()
                const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`

                const storageRef = ref(storage, 'images/' + fileName)

                const uploadTask = uploadBytesResumable(storageRef, image);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        switch (snapshot.state) {
                            case 'paused':
                                console.log('Upload is paused');
                                break;
                            case 'running':
                                console.log('Upload is running');
                                break;
                        }
                    },
                    (error) => {
                        reject(error)
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            resolve(downloadURL);
                        });
                    });
            })
        }
        const imgUrls = await Promise.all(
            [...images].map((image) => storeImage(image))
        ).catch(() => {
            setLoading(false)
            toast.error('Images not uploaded')
            return
        })

        const formDataCopy = {
            ...formData,
            imgUrls,
            geolocation,
            timestamp: serverTimestamp()
        }
        formDataCopy.location = address
        delete formDataCopy.images
        delete formDataCopy.address
        !formDataCopy.offer && delete formDataCopy.discountedPrice

        const docRef = await addDoc(collection(db, 'listings'),
            formDataCopy)

        setLoading(false)
        toast.success('Listing saved')
        navigate(`/category/${formDataCopy.type}/${docRef.id}`)
    }


    const onMutate = e => {
        let boolean = null

        if (e.target.value === 'true') {
            boolean = true
        }
        if (e.target.value === 'false') {
            boolean = false
        }
        // Files
        if (e.target.files) {
            setFormData((prevState) => ({
                ...prevState,
                images: e.target.files
            }))
        }
        // Text/Booleans/Numbers
        if (!e.target.files) {
            setFormData((prevState) => ({
                ...prevState,
                [e.target.id]: boolean ?? e.target.value
            }))
        }
    }

    // const [data, setData] = useState([]);
    // useEffect(() => {
    //     const unsubscribe = onSnapshot(collection(db, 'listings'), (snapshot) => {
    //         const fetchedData = snapshot.docs.map((doc) => ({
    //             id: doc.id,
    //             ...doc.data(),   }));
    //         setData(fetchedData);});
    //     return () => {
    //         console.log(data)
    //         unsubscribe(); // Unsubscribe from the listener when the component unmounts
    //     }; }, []);

    if (loading) {
        return <Spinner />
    }

    return (
        <div className="profile">
            <header>
                <p className="pageHeader">Edit Listing</p>
            </header>

            <main>
                <form onSubmit={onSubmit}>
                    <label className="formLabel">Sell / Rent</label>
                    <div className="formButtons">
                        <button type="button" className={type === 'sale' ?
                            'formButtonActive' : 'formButton'} id="type"
                            value='sale' onClick={onMutate}  >
                            Sell
                        </button>
                        <button type="button" className={type === 'rent' ?
                            'formButtonActive' : 'formButton'} id="type"
                            value='rent' onClick={onMutate}  >
                            Rent
                        </button>
                    </div>

                    <label className="formLabel">Name</label>
                    <input type="text" value={name}
                        onChange={onMutate} maxLength='32' minLength='10'
                        className="formInput" id="name"
                        required />

                    <div className="formRooms flex">
                        <div>
                            <label className="formLabel">Bedrooms</label>
                            <input type="number" className="formInputSmall"
                                id="bedrooms" value={bedrooms}
                                onChange={onMutate} min='1' max='50' required />
                        </div>
                        <div>
                            <label className="formLabel">Bathrooms</label>
                            <input type="number" className="formInputSmall"
                                id="bathrooms" value={bathrooms}
                                onChange={onMutate} min='1' max='50' required />
                        </div>
                    </div>

                    <label className="formLabel">Parking spot</label>
                    <div className="formButtons">
                        <button className={parking ? 'formButtonActive' : 'formButton'} type='button'
                            id='parking' value={true}
                            onClick={onMutate} >
                            Yes
                        </button>
                        <button className={
                            !parking && parking !== null ? 'formButtonActive' : 'formButton'} type='button'
                            id='parking' value={false}
                            onClick={onMutate} >
                            No</button>
                    </div>

                    <label className="formLabel">Furnished</label>
                    <div className="formButtons">
                        <button className={furnished ? 'formButtonActive' : 'formButton'} type='button'
                            id='furnished' value={true}
                            onClick={onMutate} >
                            Yes
                        </button>
                        <button className={
                            !furnished && furnished !== null ? 'formButtonActive' : 'formButton'} type='button'
                            id='furnished' value={false}
                            onClick={onMutate} >
                            No</button>
                    </div>

                    <label className="formLabel">Address</label>
                    <textarea type='text' id="address"
                        value={address} onChange={onMutate} className="formInputAddress" required />

                    {!geolocationEnabled && (
                        <div className="formLatLng ">
                            <div className="latlngSmall">
                                <label className="formLabel">Latitude</label>
                                <input type="number" className="formInputSmall "
                                    id="latitude" value={latitude}
                                    onChange={onMutate} required />
                            </div>
                            <div className="latlngSmall">
                                <label className="formLabel">Longitude</label>
                                <input type="number" className="formInputSmall "
                                    id="longitude" value={longitude}
                                    onChange={onMutate} required />
                            </div>
                        </div>
                    )}

                    <label className="formLabel">Offer</label>
                    <div className="formButtons">
                        <button className={offer ? 'formButtonActive' : 'formButton'} type='button'
                            id='offer' value={true}
                            onClick={onMutate} >
                            Yes
                        </button>
                        <button className={
                            !offer && offer !== null ? 'formButtonActive' : 'formButton'} type='button'
                            id='offer' value={false}
                            onClick={onMutate} >
                            No</button>
                    </div>

                    <label className="formLabel">Regular Price</label>
                    <div className="formPriceDiv">
                        <input type="number" className="formInputSmall"
                            id="regularPrice" value={regularPrice}
                            onChange={onMutate} min={50} max={999999999} required
                        />
                        {type === 'rent' &&
                            <p className="formPriceText">$ / Month</p>}
                    </div>

                    {offer && (
                        <>
                            <label className="formLabel">Discounted Price</label>
                            <input type="number" className="formInputSmall"
                                id="discountedPrice" value={discountedPrice}
                                onChange={onMutate} min={50} max={999999999} required={offer} />
                        </>
                    )}

                    <label className="formLabel">Images</label>
                    <p className="imagesInfo">The first image will be the cover (max 6).</p>
                    <input type="file" className="formInputFile"
                        id="images" onChange={onMutate} max='6'
                        accept=".jpg, .png, .jpeg"
                        multiple required />

                    <button type="submit" className="primaryButton">
                        Edit Listing
                    </button>
                </form>
            </main>
        </div>
    );
}

export default EditListing;