import "./ProfileLegacy.css";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Profile({
  name,
  headline,
  email,
  photoUrl,
  about,
  targetRole,
  skills = [],
  resumes = [],
  experience = [],
  education = [],
  certifications = [],
  honors = [],
  onViewAllSkills,
  onViewAllResumes,
  onViewAllExperience,
  onViewAllEducation,
  onViewAllCertifications,
  onViewAllHonors,
}) {
  const previewSkills = skills.slice(0, 6);
  const previewResumes = resumes.slice(0, 3);
  const previewExperience = experience.slice(0, 3);
  const previewEducation = education.slice(0, 2);
  const previewCertifications = certifications.slice(0, 3);
  const previewHonors = honors.slice(0, 3);

  return (
    <div className="profile">
      <section className="profile-basic-info">
        {photoUrl ? (
          <img
            className="profile-photo"
            src={photoUrl}
            alt={`${name}'s profile photo`}
          />
        ) : (
          <div className="profile-photo profile-initials">
            {getInitials(name)}
          </div>
        )}
        <div>
          <h1>{name || "Your Name"}</h1>
          <p className="profile-headline">
            {headline || "Add a headline to describe yourself"}
          </p>
          <p className="profile-email">{email || "your.email@example.com"}</p>
        </div>
      </section>

      <section className="profile-box">
        <h2>About</h2>
        <p>{about || "Add a short bio to tell others about yourself."}</p>
      </section>

      <section className="profile-box">
        <h2>Target Role</h2>
        <p>{targetRole || "Add the type of role you're aiming for."}</p>
      </section>

      <section className="profile-box">
        <div className="profile-box-header">
          <h2>Skills</h2>
          <button onClick={onViewAllSkills}>View all</button>
        </div>
        {previewSkills.length === 0 ? (
          <p className="empty-note">No skills added yet.</p>
        ) : (
          <div className="skill-tags">
            {previewSkills.map((skill) => (
              <span className="skill-tag" key={skill.id}>
                {skill.name}
                <span className="skill-meta">
                  {" "}
                  · {skill.category} · {skill.level}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="profile-box">
        <div className="profile-box-header">
          <h2>Resumes</h2>
          <button onClick={onViewAllResumes}>View all</button>
        </div>
        {previewResumes.length === 0 ? (
          <p className="empty-note">No resumes saved yet.</p>
        ) : (
          previewResumes.map((resume) => (
            <div className="entry-card" key={resume.id}>
              <div className="entry-card-header">
                <h3>{resume.fileName}</h3>
                {resume.isDefault && (
                  <span className="entry-type-tag">Default</span>
                )}
              </div>
              <p className="entry-subtext">Uploaded {resume.uploadedDate}</p>
            </div>
          ))
        )}
      </section>

      <section className="profile-box">
        <div className="profile-box-header">
          <h2>Experience &amp; Projects</h2>
          <button onClick={onViewAllExperience}>View all</button>
        </div>
        {previewExperience.length === 0 ? (
          <p className="empty-note">No experience or projects added yet.</p>
        ) : (
          previewExperience.map((entry) => (
            <div className="entry-card" key={entry.id}>
              <div className="entry-card-header">
                <h3>{entry.title}</h3>
                <span className="entry-type-tag">{entry.type}</span>
              </div>
              <p className="entry-subtext">
                {entry.organization} · {entry.dateRange}
              </p>
              <p className="entry-description">{entry.description}</p>
            </div>
          ))
        )}
      </section>

      <section className="profile-box">
        <div className="profile-box-header">
          <h2>Education</h2>
          <button onClick={onViewAllEducation}>View all</button>
        </div>
        {previewEducation.length === 0 ? (
          <p className="empty-note">No education added yet.</p>
        ) : (
          previewEducation.map((entry) => (
            <div className="entry-card" key={entry.id}>
              <h3>{entry.school}</h3>
              <p className="entry-subtext">
                {entry.degree} · {entry.dateRange}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="profile-box">
        <div className="profile-box-header">
          <h2>Certifications</h2>
          <button onClick={onViewAllCertifications}>View all</button>
        </div>
        {previewCertifications.length === 0 ? (
          <p className="empty-note">No certifications added yet.</p>
        ) : (
          previewCertifications.map((entry) => (
            <div className="entry-card" key={entry.id}>
              <h3>{entry.name}</h3>
              <p className="entry-subtext">
                {entry.issuer} · {entry.dateEarned}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="profile-box">
        <div className="profile-box-header">
          <h2>Honors &amp; Awards</h2>
          <button onClick={onViewAllHonors}>View all</button>
        </div>
        {previewHonors.length === 0 ? (
          <p className="empty-note">No honors or awards added yet.</p>
        ) : (
          previewHonors.map((entry) => (
            <div className="entry-card" key={entry.id}>
              <h3>{entry.title}</h3>
              <p className="entry-subtext">
                {entry.issuer} · {entry.dateEarned}
              </p>
            </div>
          ))
        )}
      </section>

      <footer className="profile-footer">
        <span>Resume Parser</span>
        <span>Analyze Resume</span>
        <span>Analysis History</span>
        <span>Help</span>
      </footer>
    </div>
  );
}

export default Profile;
