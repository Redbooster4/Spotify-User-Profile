import { useState } from 'react';
import { useEffect } from 'react';
import Aurora from './React-bits/Aurora.jsx';
import ArtistCard from './Components/ArtistCard.jsx';
import CardNav from './React-bits/CardNav.jsx';
import logo from './FireLogo.gif';

function SpotifyProfile() {
    const [profile, setProfile] = useState(null);
    const [topArtists, setTopArtists] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8888/profile", {
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                console.log("PROFILE RESPONSE:", data);
                if (!data.error) {
                    setProfile(data);
                }
            })
            .catch(err => console.error("FETCH ERROR:", err));
    }, []);

    useEffect(() => {
        if (!profile) return;

        fetch("http://127.0.0.1:8888/top-artists", {
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                console.log("RAW DATA:", data);
                console.log("HAS ITEMS:", Array.isArray(data.items));
                console.log("ITEMS LENGTH:", data.items?.length);

                if (!data.error) {
                    setTopArtists(data.items ?? data);
                }
            })
            .catch(err => console.error("TOP ARTISTS ERROR:", err));
    }, [profile]);

    const items = [
        {
            label: "About",
            bgColor: "#0B1020",
            textColor: "#E5E7EB",
            links: [
                { label: "Company", ariaLabel: "About Company" },
                { label: "Careers", ariaLabel: "About Careers" }
            ]
        },
        {
            label: "Projects",
            bgColor: "#0F172A",
            textColor: "#E5E7EB",
            links: [
                { label: "Featured", ariaLabel: "Featured Projects" },
                { label: "Case Studies", ariaLabel: "Project Case Studies" }
            ]
        },
        {
            label: "Contact",
            bgColor: "#020617",
            textColor: "#E5E7EB",
            links: [
                { label: "Email", ariaLabel: "Email us" },
                { label: "Twitter", ariaLabel: "Twitter" },
                { label: "LinkedIn", ariaLabel: "LinkedIn" }
            ]
        }
    ];

    return (
        <>
            <div className="background">
                <Aurora
                    colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                    blend={0.5}
                    amplitude={1.0}
                    speed={0.5}
                />
            </div>

            <CardNav
                logo={logo}
                logoAlt="Fire"
                items={items}
                baseColor="#020617"
                menuColor="#ffffffff"
                buttonBgColor="#1E293B"
                buttonTextColor="#CBD5F5"
                ease="power3.out"
            />

            <div className="SpotifyProfile">
                {!profile && (
                    <h1>Spotify Profile</h1>
                )}
                {!profile && (
                    <button
                        className="add-btn"
                        onClick={() => {
                            window.location.href = "http://127.0.0.1:8888/login";
                        }}>
                        Login To Your Spotify Account
                    </button>
                )}
                {profile && (
                    <>
                        <h1>Logged in as {profile.display_name}</h1>
                        <p>
                            <strong>ID:</strong> {profile.id}
                        </p>
                        {profile.external_urls?.spotify && (
                            <p>
                                <strong>Spotify:</strong>{" "}
                                <a
                                    href={profile.external_urls.spotify}
                                    target="_blank"
                                    rel="noreferrer">
                                    Open Profile
                                </a>
                            </p>
                        )}
                        <p>
                            <strong>Email:</strong> {profile.email}
                        </p>
                        <div>
                            <ArtistCard artists={topArtists} />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default SpotifyProfile;