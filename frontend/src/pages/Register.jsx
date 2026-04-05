import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', data);
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'Please login your account',
      });
      navigate('/login');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.response?.data?.message || 'Something went wrong',
      });
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100"
      >
        <form className="card-body" onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-2xl font-bold text-center mb-4">Register for LuxeFuel</h2>
          <div className="form-control">
            <label className="label"><span className="label-text">Name</span></label>
            <input type="text" placeholder="name" className="input input-bordered" {...register('name')} />
            {errors.name && <span className="text-error text-sm mt-1">{errors.name.message}</span>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Email</span></label>
            <input type="email" placeholder="email" className="input input-bordered" {...register('email')} />
            {errors.email && <span className="text-error text-sm mt-1">{errors.email.message}</span>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Password</span></label>
            <input type="password" placeholder="password" className="input input-bordered" {...register('password')} />
            {errors.password && <span className="text-error text-sm mt-1">{errors.password.message}</span>}
          </div>
          <div className="form-control mt-6">
            <button className="btn btn-primary">Register</button>
          </div>
          <label className="label mt-2 justify-center">
            <Link to="/login" className="label-text-alt link link-hover">Already have an account? Login</Link>
          </label>
        </form>
      </motion.div>
    </div>
  );
}
export default Register;
