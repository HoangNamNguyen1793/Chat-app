import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import ImageSidebar from "../components/layout/ImageSidebar";

const Home: NextPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <Head>
        <title>Chat App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
    </div>
  );
};

export default Home;
