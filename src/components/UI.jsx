// Shared utility components

export function SectionPanel({ title, description, children, action }) {
  return (
    <div className="glass-card section-panel">
      <div className="section-panel__header">
        <div className="section-panel__title-group">
          <h3 className="section-panel__title">{title}</h3>
          {description && <p className="section-panel__desc">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={28} style={{ opacity: 0.3 }} />}
      <p>{message}</p>
    </div>
  );
}

export function PageState({ title, body }) {
  return (
    <div className="page-state">
      <div className="page-state__spinner" />
      <p className="page-state__title">{title}</p>
      {body && <p className="page-state__body">{body}</p>}
    </div>
  );
}

export function Badge({ status }) {
  const label = status
    .split('_')
    .map(p => p[0].toUpperCase() + p.slice(1))
    .join(' ');
  return <span className={`badge badge--${status}`}>{label}</span>;
}

export function InputField({ label, id, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function SelectField({ label, id, value, onChange, options, disabled, placeholder }) {
  return (
    <div className="field-group">
      {label && <label htmlFor={id}>{label}</label>}
      <select 
        id={id} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
