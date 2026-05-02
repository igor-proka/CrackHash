export function AmbientScene() {
    return (
        <div className="ambient-scene" aria-hidden="true">
            <span className="celestial" />
            {Array.from({ length: 12 }, (_, index) => (
                <span key={`star-${index + 1}`} className={`star star-${index + 1}`} />
            ))}
            {Array.from({ length: 6 }, (_, index) => (
                <span key={`cloud-${index + 1}`} className={`cloud cloud-${index + 1}`} />
            ))}
        </div>
    );
}
