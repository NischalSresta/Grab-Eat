import React from 'react';
import TableManagementPage from '../admin/TableManagementPage';

// Alias page — routes /tables/admin to the full management view
const AdminTablesPage: React.FC = () => {
  return <TableManagementPage />;
};

export default AdminTablesPage;
