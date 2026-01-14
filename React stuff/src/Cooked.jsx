import { useEffect, useState } from 'react';
import Aurora from './React-bits/Aurora.jsx';
import ArtistCard from './Components/ArtistCard.jsx';
import CardNav from './React-bits/CardNav.jsx';
import logo from './FireLogo.gif';

const URL = import.meta.env.VITE_BACKEND_URL;

function SpotifyProfile() {
    const [profile, setProfile] = useState(null);
    const [topArtists, setTopArtists] = useState([]);
    const [roast, setRoast] = useState("");

    useEffect(() => {
        fetch(`${URL}/profile`, {
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setProfile(data);
                }
            })
            .catch(err => console.error("FETCH ERROR:", err));
    }, []);

    useEffect(() => {
        if (!profile) return;
        fetch(`${URL}/top-artists`, {
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setTopArtists(data.items);
                }
            })
            .catch(err => console.error("TOP ARTISTS ERROR:", err));
    }, [profile]);

    const getRoast = async () => {
        if (!profile) return;
        if (!topArtists) return;
        //Initial text just after the Roast Me Button
        setRoast("Cooking up your Roast.... (might take a few seconds)");
        await fetch(`${URL}/roast`, {
            method: "POST",
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                if (!data.error) setRoast(data.roast);
            })
            .catch(err => {
                console.error("ROAST ERROR: ", err)
            });
    }

    const onLogout = async () => {
        await fetch(`${URL}/logout`, {
            method: "POST",
            credentials: "include"
        })
        setProfile(null);
        setTopArtists([]);
        setRoast("");
    }
    //CardNav elements
    const items = [
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
                { label: "Email", ariaLabel: "Email us", href: "mailto:neev.p4@gmail.com" },
                { label: "GitHub", ariaLabel: "GitHub", href: "https://github.com/Redbooster4" },
                { label: "LinkedIn", ariaLabel: "LinkedIn", href: "https://www.linkedin.com/in/neev-panchal-b51431313/" }
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
                logoAlt="Cooked"
                items={items}
                baseColor="#020617"
                menuColor="#ffffffff"
                buttonBgColor="#1E293B"
                buttonTextColor="#CBD5F5"
                ease="power3.out"
                handleLogout={onLogout}
            />
            <div className="Cooked">
                {!profile && (
                    <h1>Cooked</h1>
                )}
                {!profile && (
                    <button
                        className="btn"
                        onClick={() => {
                            window.location.href = `${URL}/login`;
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

                        <ArtistCard artists={topArtists} />

                        <button onClick={getRoast} className='btn'>Roast Me</button>

                        <textarea rows={25} cols={100} value={roast}></textarea>
                    </>
                )}
            </div>
        </>
    );
}

export default SpotifyProfile;