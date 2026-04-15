import React, { useState } from 'react'
import Step1SetUp from '../components/Step1SetUp'
import Step2Interview from '../components/Step2Interview'
import Step3Report from '../components/Step3Report'

function InterviewPage() {
    const [step,setstep] = useState(1)
    const [interviewData,setinterviewData] = useState(null)
  return (
    <div className='min-h-screen bg-gray-50'>
        {step==1 && (
            <Step1SetUp onStart={(data)=>{setinterviewData(data);
                setstep(2)
            }}/>
        )}
        {step==2 && (
            <Step2Interview interviewData={interviewData} 
            onFinish={(report)=>{setinterviewData(report);
                setstep(3)
            }}/>
            
        )}
        {step==3 && (
            <Step3Report report={interviewData}/>
        )}
    </div>
  )
}

export default InterviewPage