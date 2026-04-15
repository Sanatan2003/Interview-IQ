import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios';
import { ServerUrl } from '../App';
import Step3Report from '../components/Step3Report';

function InterviewReport() {
  const {id} = useParams()
  const [report,setReport] = useState(null);

  useEffect(()=>{
    const fatchReport = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/interview/report/" + id, {withCredentials:true})
        
        setReport(result.data)
        
      } catch (error) {
        console.log(error);
        
      }
    }
    fatchReport()
  },[])
  

  if(!report){
    return(
      <div className=' min-h-screen flex items-center justify-center '>
        <p className=' text-amber-500 text-lg'>
          Loding Report....
        </p>
      </div>
    );
  }

  
  return <Step3Report report={report}/>
    
  
}

export default InterviewReport