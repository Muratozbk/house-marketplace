import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDocs, query, collection, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase.config";
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Navigation, Pagination, Scrollbar, A11y } from 'swiper'
import 'swiper/swiper-bundle.css'
import Spinner from "./Spinner";
SwiperCore.use([Navigation, Pagination, Scrollbar, A11y])

function Slider() {
    const [loading, setLoading] = useState(true)
    const [listings, setListings] = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
        const fetchListing = async () => {
            const listingsRef = collection(db, 'listings')
            const q = query(listingsRef, orderBy('timestamp', 'desc'),
                limit(5))
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
        fetchListing()
    }, [])

    if (loading) {
        return <Spinner />
    }

    return listings && (
        <>
            <p className="exploreHeading">Recommended</p>

            <Swiper slidesPerView={1} pagination={{ clickable: true }}>
                {listings.map(({ data, id }) => (
                    <SwiperSlide key={id}>
                        <div>
                            {data.name}
                            <img src={data.imgUrls[0]} alt="" />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    )
}
export default Slider