import api from './api';

export const uploadCarPhoto = async (carId, file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(`/cars/${carId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.url;
};
