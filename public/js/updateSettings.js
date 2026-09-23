/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:8000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:8000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} atualizado com sucesso!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const uploadUserData = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url:'http://127.0.0.1:8000/api/v1/users/signup',
      data:{
        name,
        email,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', `Cadastrado com sucesso!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
