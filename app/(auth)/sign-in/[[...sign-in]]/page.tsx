'use client'

import React from 'react';

import { SignIn } from '@clerk/nextjs';
import { motion } from 'framer-motion';

const SignInPage = () => {
  return (
    <div className="flex min-h-screen w-full bg-gray-900 text-white">
      <div className="w-full  mx-auto flex flex-col justify-center items-center p-8">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
         
          
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl " style={{display:'flex',justifyContent:'center'}}>
           
            <SignIn />
          </div>
          
         
        </motion.div>
      </div>
    </div>
  );
};

export default SignInPage;