import React from 'react';

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  targetRole: string;
  skills: string[];
  projects: string[];
  achievements: string[];
  summary: string;
}

interface PrintableResumeProps {
  data: ResumeData;
}

const PrintableResume: React.FC<PrintableResumeProps> = ({ data }) => {
  const {
    fullName,
    email,
    phone,
    targetRole,
    skills,
    projects,
    achievements,
    summary,
  } = data;

  return (
    <div className="bg-white text-slate-900 p-8 md:p-12 max-w-[210mm] mx-auto min-h-[297mm] shadow-none print:shadow-none font-serif leading-snug tracking-tight printable-content">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold uppercase tracking-tighter mb-1 font-sans text-slate-950">{fullName || 'Your Name'}</h1>
        <p className="text-xl font-semibold text-indigo-700 mb-4 font-sans tracking-wide uppercase text-sm">{targetRole || 'Target Role'}</p>
        <div className="text-[11px] text-slate-500 font-sans flex justify-center items-center gap-6 border-y border-slate-100 py-3">
          {email && <span className="flex items-center gap-1.5 underline decoration-slate-200">{email}</span>}
          {phone && <span className="flex items-center gap-1.5">{phone}</span>}
        </div>
      </header>

      {/* Summary */}
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-4">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Professional Profile</h2>
            <div className="h-px bg-slate-100 w-full" />
        </div>
        <p className="text-[13px] leading-relaxed text-slate-800 font-serif italic text-justify">
          {summary || 'Highly motivated professional with a strong academic background and practical project experience.'}
        </p>
      </section>

      {/* Skills */}
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-4">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Core Competencies</h2>
            <div className="h-px bg-slate-100 w-full" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {skills.length > 0 ? skills.map((skill, i) => (
              <span key={i} className="text-[12px] font-bold text-slate-700 font-sans">{skill}</span>
          )) : <span className="text-[12px] text-slate-500 italic">No skills listed.</span>}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-4">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Selected Projects</h2>
            <div className="h-px bg-slate-100 w-full" />
        </div>
        <div className="space-y-6">
          {projects.length > 0 ? (
            projects.map((project, index) => {
              const hasColon = project.includes(':');
              if (hasColon) {
                const [name, ...descParts] = project.split(':');
                const description = descParts.join(':').trim();
                return (
                  <div key={index} className="group">
                    <h3 className="text-[14px] font-extrabold text-slate-900 font-sans mb-1">{name.trim()}</h3>
                    <p className="text-[12px] text-slate-700 leading-relaxed pl-4 border-l-[1.5px] border-indigo-100">{description}</p>
                  </div>
                );
              }
              return (
                <div key={index} className="flex gap-3 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    <p className="text-[12px] text-slate-700 leading-relaxed font-serif">{project}</p>
                </div>
              );
            })
          ) : (
            <p className="text-[12px] text-slate-500 italic">No projects listed.</p>
          )}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center gap-4 mb-4">
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Accolades & Footprint</h2>
            <div className="h-px bg-slate-100 w-full" />
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <li key={index} className="text-[12px] text-slate-700 flex items-start gap-2 italic">
                <span className="text-indigo-400 font-bold">→</span>
                {achievement}
              </li>
            ))
          ) : (
            <li className="text-[12px] text-slate-500 italic">No achievements listed.</li>
          )}
        </ul>
      </section>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap');
        
        .printable-content {
          font-family: 'PT Serif', serif;
        }

        @media screen {
          body { 
            background: #0f1115; 
            padding: 4rem 0;
            display: flex;
            justify-content: center;
          }
          .printable-content {
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
            border-radius: 4px;
          }
        }

        @media print {
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
          }
          .printable-content { 
            padding: 20mm 20mm !important; 
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            box-shadow: none !important;
          }
          @page { 
            size: A4; 
            margin: 0; 
          }
          header { margin-top: 5mm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default PrintableResume;
