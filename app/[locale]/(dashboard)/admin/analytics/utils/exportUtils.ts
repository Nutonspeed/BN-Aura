export const exportToCSV = (data: any, filename: string) => {
  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, filename);
};

export const exportToJSON = (data: any, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadJSON(jsonContent, filename);
};

const convertToCSV = (data: any) => {
  if (!data) return '';
  
  const rows = [];
  
  // Add metrics summary
  rows.push('Analytics Summary');
  rows.push('');
  rows.push('Metric,Value,Growth');
  rows.push(`Monthly Revenue,${data.revenue?.monthly || 0},${data.revenue?.growth || 0}%`);
  rows.push(`Active Clinics,${data.clinics?.active || 0},${data.clinics?.growth || 0}%`);
  rows.push(`Total Users,${data.users?.total || 0},${data.users?.growth || 0}%`);
  rows.push(`Monthly AI Scans,${data.aiUsage?.monthlyScans || 0},${data.aiUsage?.growth || 0}%`);
  rows.push('');
  
  // Add revenue by plan
  if (data.revenue?.byPlan) {
    rows.push('Revenue by Plan');
    rows.push('Plan,Amount,Clinic Count');
    data.revenue.byPlan.forEach((item: any) => {
      rows.push(`${item.plan},${item.amount},${item.count}`);
    });
    rows.push('');
  }
  
  // Add top clinics
  if (data.aiUsage?.topClinics) {
    rows.push('Top AI Usage Clinics');
    rows.push('Clinic,Scans');
    data.aiUsage.topClinics.forEach((item: any) => {
      rows.push(`"${item.clinic}",${item.scans}`);
    });
  }
  
  return rows.join('\n');
};

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const downloadJSON = (jsonContent: string, filename: string) => {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
