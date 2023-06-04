import { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { updateDoc, doc, collection, getDocs, where, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ListingItem from '../components/ListingItem'
import homeIcon from '../assets/svg/homeIcon.svg'
import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg'

function Profile() {
    const [listings, setListings] = useState(null)
    const [loading, setLoading] = useState(true)
    const auth = getAuth()
    const [changeDetails, setChangeDetails] = useState(false)
    const [formData, setFormData] = useState({
        name: auth.currentUser.displayName,
        email: auth.currentUser.email
    })

    const navigate = useNavigate()
    const { name, email } = formData

    useEffect(() => {
        const fetchUserListings = async () => {
            const listingsRef = collection(db, 'listings')
            const q = query(
                listingsRef,
                where('userRef', '==', auth.currentUser.uid),
                orderBy('timestamp', 'desc'))

            const querySnap = await getDocs(q)

            let listings = []

            querySnap.forEach((doc) => {
                return listings.push({
                    id: doc.id,
                    data: doc.data()
                })
            })
            setListings(listings)
            setLoading(false)
        }
        fetchUserListings()
    }, [auth.currentUser.uid])

    const onLogout = () => {
        auth.signOut()
        navigate('/')
    }

    const onSubmit = async () => {
        try {
            if (auth.currentUser.displayName !== name) {
                // update display name in fb
                await updateProfile(auth.currentUser, {
                    displayName: name
                })

                // update in firestore
                const userRef = doc(db, 'users', auth.currentUser.uid)
                await updateDoc(userRef, {
                    name    //name:name
                })
            }
        } catch (error) {
            toast.error('Could not update profile details')
        }
    }

    const onChange = e => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.id]: e.target.value
        }))
    }

    //Delete and Update the listings
    const onDelete = async (listingId) => {
        if (window.confirm('Are you sure you want to delete?')) {
            await deleteDoc(doc(db, 'listings', listingId))
            const updatedListings = listings.filter((listing) =>
                listing.id !== listingId)
            setListings(updatedListings)
            toast.success('Successfully deleted listing ')
        }
    }

    return <div className="profile">
        <header className="profileHeader">
            <p className="pageHeader">My Profile</p>
            <button onClick={onLogout}
                type="button" className="logOut">LogOut</button>
        </header>

        <main>
            <div className="profileDetailsHeader">
                <p className="profileDetailsText">Personal Details</p>
                <p className="changePersonalDetails" onClick={() => {
                    changeDetails && onSubmit()
                    setChangeDetails((prevState) => !prevState)
                }}>
                    {changeDetails ? 'done' : 'change'}
                </p>
            </div>

            <div className="profileCard">
                <form>
                    <input type="text" id="name"
                        className={!changeDetails ? 'profileName' : 'profileNameActive'}
                        disabled={!changeDetails}
                        value={name}
                        onChange={onChange} />
                    <input type="text" id="email"
                        className={!changeDetails ? 'profileEmail' : 'profileEmailActive'}
                        disabled={!changeDetails}
                        value={email}
                        onChange={onChange} />
                </form>
            </div>
            <Link to='/create-listing' className="createListing">
                <img src={homeIcon} alt="home" />
                <p>Sell or rent your home</p>
                <img src={arrowRight} alt="arrow right" />
            </Link>

            {!loading && listings?.length > 0 && (
                <>
                    <p className="listingText">Your Listings</p>
                    <ul className="listingsList">
                        {listings.map((listing) => (
                            <ListingItem
                                key={listing.id}
                                listing={listing.data}
                                id={listing.id}
                                onDelete={() => onDelete(listing.id)} />
                        ))}
                    </ul>
                </>
            )}
        </main>
    </div>
    // useEffect(() => {setFormData(auth.currentUser)}, [])
    // return form ? <h1>{form.displayName}</h1> : 'Not Logged In'
}

export default Profile;