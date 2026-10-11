'use client'

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Solution from "@/components/landing/Solution";
import Features from "@/components/landing/Features";
import Cta from "@/components/landing/Cta";

function page() {
  return (
    <div className='h-auto w-full'>
      <Header />
      <Hero />
      <Solution />
      <Features />
      <Cta />
      <Footer />
    </div>
  )
}

export default page