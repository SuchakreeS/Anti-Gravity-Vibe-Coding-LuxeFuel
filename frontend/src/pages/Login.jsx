import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false)
});

function Login() {
  const { login } = useContext(AuthContext);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false }
  });

  const onSubmit = (data) => {
    login(data, data.rememberMe);
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-content flex-col lg:flex-row-reverse"
      >
        <div className="text-center lg:text-left ml-8 text-primary-content">
          <h1 className="text-5xl text-white font-bold">LuxeFuel</h1>
          <p className="py-6 whitespace-pre-wrap">Track consumption & expenses.\nElevate your driving experience.</p>
        </div>
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <form className="card-body" onSubmit={handleSubmit(onSubmit)}>
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
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" {...register('rememberMe')} />
                <span className="label-text">Remember me</span>
              </label>
            </div>
            <div className="form-control mt-4">
              <button className="btn btn-primary">Login</button>
            </div>
            <label className="label mt-2 justify-center">
              <Link to="/register" className="label-text-alt link link-hover">Don't have an account? Register</Link>
            </label>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
export default Login;
