export default function PageHeader({ eyebrow, title, sub, children }) {
  return (
    <div className="page-head">
      <div className="wrap">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
