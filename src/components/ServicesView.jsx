import { SectionPanel } from './UI.jsx';
import { ServiceForm, ServicesTable } from './DataComponents.jsx';

export function ServicesView({ 
  serviceForm, setServiceForm, handleServiceSubmit, 
  services, handleServiceStatusChange 
}) {
  return (
    <div className="content-grid--wide" style={{ display: 'grid', gap: '1.25rem' }}>
      <SectionPanel title="Create Service" description="Add cinema services to the shared services table.">
        <ServiceForm form={serviceForm} onChange={setServiceForm} onSubmit={handleServiceSubmit} />
      </SectionPanel>
      <SectionPanel title="Current Services" description="Live data from the services table in Supabase.">
        <ServicesTable services={services} onStatusChange={handleServiceStatusChange} />
      </SectionPanel>
    </div>
  );
}
