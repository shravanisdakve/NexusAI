export const indiaLocations = {
    "Maharashtra": {
        "Mumbai": [
            "Indian Institute of Technology (IIT) Bombay",
            "Veermata Jijabai Technological Institute (VJTI)",
            "Sardar Patel Institute of Technology (SPIT)",
            "Dwarkadas J. Sanghvi College of Engineering (DJSCE)",
            "Thadomal Shahani Engineering College (TSEC)",
            "K. J. Somaiya College of Engineering",
            "Vivekanand Education Society's Institute of Technology (VESIT)",
            "Fr. Conceicao Rodrigues College of Engineering (CRCE)",
            "Don Bosco Institute of Technology (DBIT)",
            "Vidyalankar Institute of Technology (VIT)",
            "Atharva College of Engineering",
            "Rajiv Gandhi Institute of Technology (RGIT)",
            "St. Francis Institute of Technology (SFIT)",
            "Thakur College of Engineering and Technology (TCET)",
            "Rizvi College of Engineering",
            "Shah and Anchor Kutchhi Engineering College",
            "Other"
        ],
        "Pune": [
            "College of Engineering Pune (COEP)",
            "Pune Institute of Computer Technology (PICT)",
            "Vishwakarma Institute of Technology (VIT)",
            "Cummins College of Engineering for Women",
            "Maharashtra Institute of Technology (MIT) World Peace University",
            "Symbiosis Institute of Technology (SIT)",
            "Army Institute of Technology (AIT)",
            "Bharati Vidyapeeth Deemed University College of Engineering",
            "Sinhgad College of Engineering",
            "D.Y. Patil College of Engineering",
            "Other"
        ],
        "Nagpur": [
            "Visvesvaraya National Institute of Technology (VNIT)",
            "Shri Ramdeobaba College of Engineering and Management (RCOEM)",
            "Yeshwantrao Chavan College of Engineering (YCCE)",
            "G.H. Raisoni College of Engineering",
            "Laxminarayan Institute of Technology (LIT)",
            "Other"
        ]
    },
    "Delhi NCR": {
        "New Delhi": [
            "Indian Institute of Technology (IIT) Delhi",
            "Delhi Technological University (DTU)",
            "Netaji Subhas University of Technology (NSUT)",
            "Indraprastha Institute of Information Technology (IIIT) Delhi",
            "Maharaja Agrasen Institute of Technology (MAIT)",
            "Guru Gobind Singh Indraprastha University (GGSIPU)",
            "Jamia Millia Islamia",
            "Other"
        ],
        "Noida": [
            "Jaypee Institute of Information Technology (JIIT)",
            "Amity University",
            "Noida Institute of Engineering and Technology (NIET)",
            "JSS Academy of Technical Education",
            "Other"
        ]
    },
    "Karnataka": {
        "Bangalore": [
            "Indian Institute of Science (IISc)",
            "International Institute of Information Technology (IIIT) Bangalore",
            "R.V. College of Engineering (RVCE)",
            "BMS College of Engineering",
            "M.S. Ramaiah Institute of Technology (MSRIT)",
            "PES University",
            "Bangalore Institute of Technology (BIT)",
            "Dayananda Sagar College of Engineering",
            "Other"
        ],
        "Mysore": [
            "The National Institute of Engineering (NIE)",
            "Sri Jayachamarajendra College of Engineering (SJCE)",
            "Vidya Vardhaka College of Engineering",
            "Other"
        ]
    },
    "Tamil Nadu": {
        "Chennai": [
            "Indian Institute of Technology (IIT) Madras",
            "Anna University (CEG Guindy)",
            "Madras Institute of Technology (MIT)",
            "SSN College of Engineering",
            "SRM Institute of Science and Technology",
            "Vellore Institute of Technology (VIT) Chennai",
            "Sathyabama Institute of Science and Technology",
            "Other"
        ],
        "Coimbatore": [
            "PSG College of Technology",
            "Coimbatore Institute of Technology (CIT)",
            "Kumaraguru College of Technology",
            "Sri Krishna College of Engineering and Technology",
            "Other"
        ],
        "Trichy": [
            "National Institute of Technology (NIT) Trichy",
            "Other"
        ]
    },
    "Telangana": {
        "Hyderabad": [
            "Indian Institute of Technology (IIT) Hyderabad",
            "International Institute of Information Technology (IIIT) Hyderabad",
            "Jawaharlal Nehru Technological University (JNTUH)",
            "Osmania University College of Engineering",
            "Chaitanya Bharathi Institute of Technology (CBIT)",
            "VNR Vignana Jyothi Institute of Engineering and Technology",
            "Vasavi College of Engineering",
            "Other"
        ]
    },
    "West Bengal": {
        "Kolkata": [
            "Jadavpur University",
            "Institute of Engineering and Management (IEM)",
            "Heritage Institute of Technology",
            "Techno India University",
            "Other"
        ],
        "Kharagpur": [
            "Indian Institute of Technology (IIT) Kharagpur",
            "Other"
        ]
    },
    "Uttar Pradesh": {
        "Kanpur": [
            "Indian Institute of Technology (IIT) Kanpur",
            "Harcourt Butler Technical University (HBTU)",
            "Pranveer Singh Institute of Technology (PSIT)",
            "Other"
        ],
        "Varanasi": [
            "Indian Institute of Technology (IIT) BHU",
            "Other"
        ],
        "Prayagraj": [
            "Motilal Nehru National Institute of Technology (MNNIT) Allahabad",
            "Other"
        ]
    },
    "Other": {
        "Other": ["Other"]
    }
};

export const getStates = () => Object.keys(indiaLocations);
export const getCities = (state: string) => state ? Object.keys(indiaLocations[state as keyof typeof indiaLocations] || {}) : [];
export const getColleges = (state: string, city: string) => {
    if (!state || !city) return [];
    // @ts-ignore
    return indiaLocations[state]?.[city] || [];
};
