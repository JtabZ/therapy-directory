import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

// Function to process therapist data from CSV
const processTherapists = (data) => {
  const therapists = new Map();
  
  data.forEach(row => {
    const name = row['Therapist Name']?.trim();
    const specialty = row['Specialty Group']?.trim();
    const location = row['Clinic Name']?.trim();
    const address = row['Address']?.trim();
    const notes = row['Notes']?.trim(); // Add notes field
    
    if (name && specialty && location) {
      if (!therapists.has(name)) {
        therapists.set(name, {
          name,
          specialties: new Set([specialty]),
          location,
          address,
          notes // Include notes in therapist data
        });
      } else {
        therapists.get(name).specialties.add(specialty);
      }
    }
  });
  
  return Array.from(therapists.values()).map(t => ({
    ...t,
    specialties: Array.from(t.specialties)
  }));
};

export default function TherapyDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQZ8OCh9Affy-AmVnhmNA0JJPbcx1ABir0vzNIk5qTcfrWyqNx3QSh_l9TIMrT-6QWoHxWezITtrNn3/pub?output=csv');
        const text = await response.text();
        
        // Parse CSV
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        const data = rows.slice(1).map(row => {
          const values = row.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim() || '';
            return obj;
          }, {});
        });
        
        const processedData = processTherapists(data);
        setTherapists(processedData);
      } catch (err) {
        setError('Error loading therapist data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const specialties = ['All', ...new Set(therapists.flatMap(t => t.specialties))].sort();
  const locations = ['All', ...new Set(therapists.map(t => t.location))].sort();

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || therapist.specialties.includes(selectedSpecialty);
    const matchesLocation = selectedLocation === 'All' || therapist.location === selectedLocation;
    return matchesSearch && matchesSpecialty && matchesLocation;
  });

  if (loading) return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-100"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-200"></div>
      </div>
      <div className="text-center mt-4 text-gray-600">Loading therapist directory...</div>
    </div>
  );
  
  if (error) return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
        {error}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Therapy Directory</h1>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search therapists..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2 border rounded-lg flex-1 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            value={selectedSpecialty}
          >
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
          
          <select 
            className="px-4 py-2 border rounded-lg flex-1 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            onChange={(e) => setSelectedLocation(e.target.value)}
            value={selectedLocation}
          >
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialties</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTherapists.map((therapist, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{therapist.name}</div>
                    {therapist.notes && (
                      <div className="text-sm text-blue-600 mt-1">{therapist.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {therapist.specialties.map((specialty, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{therapist.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{therapist.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}