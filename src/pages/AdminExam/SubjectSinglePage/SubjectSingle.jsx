//code
import React, { useContext, useEffect, useRef, useState } from 'react'
import { SideBar } from '../../../components/SideBar/SideBar'
import { Alert, Backdrop, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, Input, InputLabel, MenuItem, Paper, Select, Slide, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip} from '@mui/material'
import { ArrowBack, Article, DeleteForever, Edit, Label, Menu, Padding, Public, PublicOff, Publish, Save, Settings, Unpublished } from "@mui/icons-material";
import { NavBar } from '../../../components/NavBar/NavBar'
import { AccountCard } from '../../../components/AccountCard/AccountCard'
import AddBoxIcon from '@mui/icons-material/AddBox';
import './SubjectSingle.scss'
import { db, storage } from '../../../firebase';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Exams } from '../../../Exams';
import { UserContext } from '../../../contex/UserContext';
import ChecklistIcon from '@mui/icons-material/Checklist';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';


export const SubjectSingle = () => {

  const year =  JSON.parse(localStorage.getItem('session'));
  const subject =  JSON.parse(localStorage.getItem('subject'));
  const term =  JSON.parse(localStorage.getItem('term'));
  const grade =  JSON.parse(localStorage.getItem('class'));
  const HodSubjects = JSON.parse(localStorage.getItem('hodSubjects'));
  const [examsList, setExamsList] = useState([]);
  const [hodDepartments, setHodDepartments] = useState();
  const [hodConfirmed, setHodConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [notApprovedMsg, setNotApprovedMsg] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useContext(UserContext);

  // const examsList = Exams(null, year,term,grade,subject);
  
  const [publishSucess, setPublishSuccess] = useState(false);

  //fetch user Department
  const fetchDepartments = () =>{
    const departmentsRef = collection(db, "departments");
    const q = query(departmentsRef, where("hodId", "==", currentUser.uid));

    // Set up a real-time listener using onSnapshot
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updateddepartments = [];
      querySnapshot.forEach((doc) => {
        updateddepartments.push(doc.id);
      });

      setHodDepartments(updateddepartments);
      console.log(updateddepartments);
    });

    return unsubscribe;
    
  }

  useEffect(() => {
    const unsubscribe = fetchDepartments(); // Call fetchDepartments directly
    return () => {
      unsubscribe(); // Clean up the listener when the component unmounts
    };
  }, []);
  
  useEffect(() => {
    const examsRef = collection(db, 'exams');
    setLoading(true)
    const queryFilters = [
      where('session', '==', year),
      where('term', '==', term),
      where('subject', '==', subject),
      where('class', '==', grade),
    ];
  
    const q = query(examsRef, ...queryFilters);
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const examsData = [];
        querySnapshot.forEach((doc) => {
          const exam = doc.data(); // Call the function to get the actual data
          examsData.push(exam);
        });
        console.log("exams")
        setExamsList(examsData);
        confirmHod();
        setLoading(false);
      });
  
      return () => {
        unsubscribe(); // Clean up the listener when the component unmounts
      };
    }, [year, term, subject, grade]);
    
    
    const confirmHod = () =>{
      
      const notEqual = HodSubjects.every(item => item !== subject);
        if(!notEqual)
        {
          setHodConfirmed(true);
          
        }
      
    }
  
  
  

  //setting selected exam to dummy so we dont get undefined error at the start
  const [selectedExam, setSelectedExam] = useState(
    {
      name: 'exam',
      public: false,
      questionNo : 10,
      questions : [
        {
          question : 'what is rule of law',
          options : [
            {optionText: '', isCorrect: false},
            {optionText: '', isCorrect: false},
            {optionText: '', isCorrect: false},
            {optionText: 'Rights of minority', isCorrect: false}
          ]
        }
      ]
    }
  );

  const [results, setResults] = useState();
 
  const fetchResults = (exam) =>{
    const resultsRef = collection(db, `exams/${year+term+grade+subject+exam.name}/results`);
    const q = query(resultsRef);

    // Set up a real-time listener using onSnapshot
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedResults = [];
      querySnapshot.forEach((doc) => {
        const resultData = doc.data();
        const result = {
          name : doc.id,
          ...resultData,
        }
        updatedResults.push(result);
      });

      setResults(updatedResults);
      console.log('results fetched');
    });

    return () => {
      unsubscribe(); // Clean up the listener when the component unmounts
    };
  }
  

  const [examOpen, setExamOpen] = useState(false)
  const [deleteExam, setDeleteExam] = useState(null);
  const [showDeleteDialouge, setShowDeleteDialouge] = useState(false);
  const [showAddDialouge, setShowAddDialouge] = useState(false);
  const [showSettingsDialouge, setShowSettingsDialouge] = useState(false);
  const [examName, setExamName] = useState(null);
  const [examNameError, setExamNameError] = useState(false);
  const [value, setValue] = useState();
  const [qnoerr, setqnoerr] = useState(false);
  const [opValue, setOpValue] = useState(() => {
    const initialArray = [];
    for (let i = 0; i < selectedExam.questions.length; i++) {
      initialArray.push([
        selectedExam.questions[i].options[0].optionText,
        selectedExam.questions[i].options[1].optionText,
        selectedExam.questions[i].options[2].optionText,
        selectedExam.questions[i].options[3].optionText,
      ]);
    }
    return initialArray;
  });

  //setting the two dimensional array for each question with four options
  const [opSelectValue, setOpselectValue] = useState(() => {
    const initialArray = [];
    for (let i = 0; i < selectedExam.questions.length; i++) {
      initialArray.push([
        selectedExam.questions[i].options[0].isCorrect,
        selectedExam.questions[i].options[1].isCorrect,
        selectedExam.questions[i].options[2].isCorrect,
        selectedExam.questions[i].options[3].isCorrect,
       ]);
    }
    
    
    return initialArray;
  });

  const [qValue, setQvalue] = useState(() =>{
    const initialArray = [];
    for (let i = 0; i < selectedExam.questions.length; i++) {
      initialArray.push(
        selectedExam.questions[i].question,
       )
    }
    return initialArray;
  }
  );

  const [qImg, setQImg] = useState(() =>{
    const initialArray = [];
    for (let i = 0; i < selectedExam.questions.length; i++) {
      initialArray.push(
        selectedExam.questions[i].img,
       )
    }
    return initialArray;
  }
  );

  const [imgName, setImgName] = useState([]);

 //using useEffect to redeclare the two dimensional array ans setting it to setOpselect each time selectedExam changes
  useEffect(() => {
    const initialArray = [];
    const initialArrayValue = [];
    const initialArrayQuestion = [];
    const initialArrayImg = [];
    const initialArrayImgUrl = [];
    const initialArrayImgName = [];

    for (let i = 0; i < selectedExam.questions.length; i++) {
      initialArray.push([
        selectedExam.questions[i].options[0].isCorrect,
        selectedExam.questions[i].options[1].isCorrect,
        selectedExam.questions[i].options[2].isCorrect,
        selectedExam.questions[i].options[3].isCorrect,
      ]);

      initialArrayValue.push([
        selectedExam.questions[i].options[0].optionText,
        selectedExam.questions[i].options[1].optionText,
        selectedExam.questions[i].options[2].optionText,
        selectedExam.questions[i].options[3].optionText,
      ]);

      initialArrayQuestion.push(
        selectedExam.questions[i].question
      )

      

      initialArrayImgName.push(
        selectedExam.questions[i].img
      )

      initialArrayImgUrl.push(
        selectedExam.questions[i].imgUrl
      )

    }
    setOpselectValue(initialArray);
    setOpValue(initialArrayValue);
    setQvalue(initialArrayQuestion);
    setImgName(initialArrayImgName)
  }, [selectedExam]);


  const [qIndex, setQIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [duration, setDuration] = useState(1800)
  


  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  const [sidetoggle, setSidetoggle] = useState('hidden')
  function hideMenu (){
    
    setSidetoggle('show')
  }
  function showMenu (){
    
    setSidetoggle('hidden')
    
  }

  const [open, setOpen] = useState(false);
    const handleClose = () => {
        setOpen(false);
    };
    const handleOpen = () => {
        setOpen(true);
    };
    // adding exam
    const handleAddExam = () =>{
      if (examName) {
        setqnoerr(false)
        console.log(value);
        if(value > 0)
        {
          const newExam = {
            name: examName,
            public: false,
            approved: false,
            questionNo : value,
            duration : duration,
            session: year,
            term : term,
            class: grade,
            subject: subject,
            questions : [
              
            ]
          };

          for(let i = 0; i < newExam.questionNo; i++)
          {
            newExam.questions.push(
              {
                question : '',
                img: '',
                imgUrl: '',
                options : [
                  {optionText: '', isCorrect: false},
                  {optionText: '', isCorrect: false},
                  {optionText: '', isCorrect: false},
                  {optionText: '', isCorrect: false}
                ]
              }
              )
            }
          
          const userDocRef = doc(db, 'exams', year+term+grade+subject+examName);
          setDoc(userDocRef, newExam); 
          setShowAddDialouge(!showAddDialouge);
          
        }else{
          setqnoerr(true)
        }
      }
         
    }

     // editing exam
     const handleEditExam = async() =>{
      
        if(value > 0)
        {
          const newExam = {
            questionNo : value,
            duration : duration,
            questions : [
              ...selectedExam.questions
            ]
          };

          const remainingQuestions = newExam.questionNo - selectedExam.questionNo;
          if(remainingQuestions > 0)
          {
            for(let i = 0; i < remainingQuestions; i++)
            {
              newExam.questions.push(
                {
                  question : '',
                  img: '',
                  imgUrl: '',
                  options : [
                    {optionText: '', isCorrect: false},
                    {optionText: '', isCorrect: false},
                    {optionText: '', isCorrect: false},
                    {optionText: '', isCorrect: false}
                  ]
                }
                )
              }
          }else{
            for(let i = 0; i > remainingQuestions; i--)
            {
              newExam.questions.pop()
            }
          }
          
          const userDocRef = doc(db, 'exams', year+term+grade+subject+ selectedExam.name);
          await updateDoc(userDocRef, newExam); 
          setShowSettingsDialouge(false);
          alert("exam edited successfully!");
          
        }else{
         
          setqnoerr(true)
        }
      
         
    }

    const handleDialouge = () =>{
      if(!examOpen){
        setShowAddDialouge(!showAddDialouge)
        setExamName(null);
        setValue()
        
      }
    }

    const namecheck = (event) =>{
      setExamNameError(false);
      let counter = 0;
      examsList.map((exam) =>{
        event.target.value === exam.name? counter++ : counter+=0;
      })
      if (counter > 0)
      {
        setExamNameError(true);
      }else{
        setExamName(event.target.value);
      }
    }

    const handleRemove = async() =>{
      try{
        const CollectionRef = collection(db, "exams");
        const DocRef = doc(CollectionRef, year+term+grade+subject+deleteExam.name);
        await deleteDoc(DocRef);
        setDeleteExam(null);
        setShowDeleteDialouge(false);
      }
      catch(error){
        console.log(error);
        setShowDeleteDialouge(false);
        setDeleteExam(null);
      }
    }

    const handledClose = () =>{
      setShowDeleteDialouge(false)
      setDeleteExam(null);
    }
    
    const handlePublish = async(exam) => {
      if(exam.approved || exam.public)
      {
        try{
          const userDocRef = doc(db, "exams", year+term+grade+subject+exam.name);
        
          // Update the fullname and email fields in Firestore 
          await updateDoc(userDocRef, {
            public: !exam.public,
            
          });
          setPublishSuccess(true);
        }catch(error){
          console.log(error);
        }
      }else{
        setNotApprovedMsg(true);
      }

    };

    const handleApprove = async(exam) => {
      try{
        const userDocRef = doc(db, "exams", year+term+grade+subject+exam.name);
      
        // Update the fullname and email fields in Firestore
        await updateDoc(userDocRef, {
          approved: !exam.approved,
          
        });
        setApproveSuccess(true);
      }catch(error){
        console.log(error);
      }

    };

    const handleQnoInputChange = (event) => {
      setValue(event.target.value === '' ? '' : Number(event.target.value))
       
      
    };
  
    const handleBlur = () => {
      if (value < 0) {
        setValue(0);
      } else if (value > 100) {
        setValue(100);
      }
    };


    function createData(name, calories, fat, carbs, protein) {
      return { name, calories, fat, carbs, protein };
    }

    const rows = [
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Omojola Iqmat', 80, 90, '11:40', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      createData('Odibo Peter', 35, 50, '11:30', '15 January'),
      
    ];

    const handleOptChange = (index, event) =>{
      const text = event.target.value;
      // Create a copy of the state array
      const updatedArray = [...opValue];
      
      // Modify the value in the copied array
      updatedArray[qIndex][index] = text;
      
      // Update the state with the modified array
      setOpValue(updatedArray);
    }
    const handleOptSelect = (event, index) =>{
      const SelectedBoolean = event.target.value;
  
      // Create a copy of the state array
      const updatedArray = [...opSelectValue];
      
      // Modify the value in the copied array
      updatedArray[qIndex][index] = SelectedBoolean;
      
      // Update the state with the modified array
      setOpselectValue(updatedArray);
      
    }

    const handlequestionChange = async(event) =>{
      try{
        const text = event.target.value;
        const updatedArray = [...qValue];
        updatedArray[qIndex] = text
        setQvalue(updatedArray);
        const userDocRef = doc(db, "exams", year+term+grade+subject+selectedExam.name);
      
      // Update the fullname and email fields in Firestore
      await updateDoc(userDocRef, {
        
      });
  
      }catch(error){

      }
    }

    const handleQuestionImgChange = (event) =>{
      const file = event.target.files[0] || '';
      const updatedArray = [...qImg];
      const updatedNameArray = [...imgName];
      updatedArray[qIndex] = file;
      updatedNameArray[qIndex] = file.name;
      setQImg(updatedArray);
      setImgName(updatedNameArray);
    }

    var handleNP = (operation) =>{
      if (operation === 'next') {
        
          qIndex < selectedExam.questions.length - 1? setQIndex(qIndex + 1) : setQIndex(qIndex)
          
        } 
      if (operation === 'previous') {
      
          qIndex > 0 ? setQIndex(qIndex - 1) : setQIndex(qIndex);
          
        } 
        
    }

    document.onkeydown = function(e) {
      switch (e.keyCode) {
          case 37:
              handleNP('previous')
              break;
          case 38:
             
              break;
          case 39:
              handleNP('next')
              break;
          case 40:
              
              break;
      }
  };

   const handleExamSelect = () =>{
      setExamOpen(true)
      console.log(selectedExam);
    }

    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveFailure, setSaveFailure] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    

    const updateQuestionInFirestore = async (questionIndex) => {
      
    try {
      const userDocRef = doc(
        db,
        "exams",
        year + term + grade + subject + selectedExam.name
      );

      // Get a shallow copy of the questions array to modify it before updating in Firestore
      const updatedQuestions = [...selectedExam.questions];
      const selectedQuestion = updatedQuestions[questionIndex];
      let imgURL = '';
      if(qImg[questionIndex])
        {
          const storageRef = ref(storage, `${year + term + grade + subject + selectedExam.name}/img${questionIndex}`);
          uploadBytes(storageRef, qImg[questionIndex])
          .then(() => getDownloadURL(storageRef))
          .then((downloadURL) => {
            
            imgURL = downloadURL;
            selectedQuestion.imgUrl = downloadURL;
            selectedQuestion.img = qImg[questionIndex].name;
          })
        }

      // Update the question details with the new data
      selectedQuestion.question = qValue[questionIndex];
      


      // Update options for the selected question
      for (let i = 0; i < 4; i++) {
        selectedQuestion.options[i].optionText = opValue[questionIndex][i];
        selectedQuestion.options[i].isCorrect = opSelectValue[questionIndex][i];
      }

      // Update the modified questions array in Firestore
      await updateDoc(userDocRef, {
        questions: updatedQuestions,
      });
    } catch (error) {
      console.log(error);
    }
  };

  

  

   const handleSave = async () => {
    setSaveLoading(true);
    try {
      // Loop through each question and update its details in Firestore
      for (let i = 0; i < selectedExam.questions.length; i++) {
       
        await updateQuestionInFirestore(i);
      }

      setSaveLoading(false);
      setSaveSuccess(true);
      setExamOpen(false);
      // Optionally, you can set some feedback to let the user know the data was saved successfully.
      // For example, set a state variable to display a success message.
      // setSaveSuccess(true);
    } catch (error) {
      // Handle the error if the update fails.
      console.log(error);
      setSaveLoading(false);
      setSaveFailure(true);
    }
  };
  
  const formatDate = (timestamp) => {
    const datestamp = timestamp?.toDate();
    const date = datestamp?.toLocaleString();
    const dateArray = date?.split(",")
    return dateArray? dateArray[0] : '';
  };
  const formatTime = (timestamp) => {
    const datestamp = timestamp?.toDate();
    const date = datestamp?.toLocaleString();
    const dateArray = date?.split(",")
    return dateArray? dateArray[1] : '';
  };

  return (
    <div>
        <div className='subjectCon'>
        <div className={`sideBar ${sidetoggle}`}>
        <SideBar />
      </div>

      <div className={`menu`} onClick={hideMenu}>
      <Menu />
      </div>

      <div className="subjectContainer" onClick={showMenu}>
        <div className="navbar"><NavBar handleOpen={handleOpen}/></div>
        <div className="profileCont">
          <div className="title">
            <h1>{subject} {year} {term} term - {grade}</h1>
          </div>

          <div className="addExamButton">
            <Tooltip title="Add an exam" arrow>
          <Button variant="contained" startIcon={<AddBoxIcon/>} className={`dbutton ${examOpen? 'disabled' : ''}`} onClick={handleDialouge}>
            EXAM
          </Button>
            </Tooltip>
          </div>

          <div className="examHistoryCon">
            <div className="examHistory">
              {(examsList?.length !== 0 && !examOpen && !showResult &&
                <div className="historyListCon">
                  {examsList?.map((exam) =>(
                    <div className="historyList" onClick={()=> setSelectedExam(exam)}>
                      <div className="details">
                        <div className="publicIcon">
                          {exam.public? <Public/> : <PublicOff/>}
                        </div>
                        <h1>{exam.name}</h1>
                      </div>

                      <div className="icons">
                        <Tooltip title="Edit">
                        <Fab color="secondary" aria-label="edit" size='small'> 
                        <Edit onClick={() => handleExamSelect(exam)}/>
                        </Fab>
                        </Tooltip>

                        <Tooltip title="Delete">
                        <Fab color="error" aria-label="edit" size='small'>
                        <DeleteForever onClick={() => {setDeleteExam(exam); setShowDeleteDialouge(true)}}/>
                        </Fab>
                        </Tooltip>

                        <Tooltip title={ exam.public? "Unpublish" : "Publish"}>
                          <Fab color="primary" aria-label="edit" size='small'>
                            {exam.public? 
                          <Unpublished onClick={() => handlePublish(exam)}/>
                          :
                          <Publish onClick={() => handlePublish(exam)}/>
                          }
                          </Fab>
                        </Tooltip>

                        {hodConfirmed &&
                          <Tooltip  title={ exam.approved? "Unapprove" : "Approve"}>
                          <Fab color={exam.approved? 'success' : "primary"} aria-label="edit" size='small'>
                          <ChecklistIcon onClick={() => handleApprove(exam)}/>
                          </Fab>
                        </Tooltip>
                        }

                        <Tooltip title="Results">
                          <Fab color="primary" aria-label="edit" size='small'>
                          <Article onClick={() =>{fetchResults(exam); setShowResult(true)}}/>
                          </Fab>
                        </Tooltip>

                        <Tooltip title="Settings">
                          <Fab  aria-label="edit" size='small'>
                          <Settings onClick={() =>{setShowSettingsDialouge(true)}}/>
                          </Fab>
                        </Tooltip>

                        
                      </div>
                     
                    </div>
                    
                  ))}

                    <Snackbar open={publishSucess} autoHideDuration={6000} onClose={() => setPublishSuccess(false)}>
                      <Alert onClose={() => setPublishSuccess(false)} severity={selectedExam.public? "info" : "success"} sx={{ width: '100%' }}>
                      {selectedExam.public? "Exam Unpublished" : " Exam Published Successfully"}
                      </Alert>
                    </Snackbar>

                    <Snackbar open={approveSuccess} autoHideDuration={6000} onClose={() => setApproveSuccess(false)}>
                      <Alert onClose={() => setApproveSuccess(false)} severity={selectedExam.approved? "info" : "success"} sx={{ width: '100%' }}>
                      {selectedExam.approved? " Exam Unapproved Successfully" : "Exam Approved"} 
                      </Alert>
                    </Snackbar>

                    <Snackbar open={notApprovedMsg} autoHideDuration={6000} onClose={() => setNotApprovedMsg(false)}>
                      <Alert onClose={() => setNotApprovedMsg(false)} severity={'warning'} sx={{ width: '100%' }}>
                        Exam not yet approved, Contact Head Of department 
                      </Alert>
                    </Snackbar>

               </div>

                
                    


                )}

                {(examsList?.length === 0 && !examOpen && !showResult &&
                  <div className="unavailable">
                  { loading?  <h1>Loading...</h1> : <h1>No Exams Available</h1>}
                  
                  </div>
                  )}

                 {(examOpen && !showResult &&
                    <div className='editQuestions'>
                      {/* header section */}

                      <div className="header">
                      <ArrowBack onClick={()=> setExamOpen(false)} sx={{cursor:'pointer'}}/>
                      <h2>{qIndex + 1}/{selectedExam.questionNo}</h2>
                      <Tooltip title="Add an exam" arrow>
                        <Button variant="contained" startIcon={<Save/>} className={`dbutton ${selectedExam? 'disabled' : ''}`} onClick={handleSave}>
                          {saveLoading? <CircularProgress /> : "Save"}
                        </Button>
                        </Tooltip>
                      </div>

                      {/* question input section */}

                      <div className="qInput">
                      <TextField
                        id="standard-multiline-static"
                        label="Enter Question"
                        multiline
                        rows={2}
                        value={qValue[qIndex]}
                        variant="standard"
                        onChange={handlequestionChange}
                        
                      />

                      </div>
                      <div className="uploadImg">
                        <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleQuestionImgChange}
                        ref={fileInputRef}
                        style={{display: "none"}}
                        />

                        <Button onClick={()=> fileInputRef.current.click()}>Upload Image</Button>
                        <p> {imgName[qIndex]} </p>

                      </div>
                       

                        {/* options section */}

                      <div className="optionSec">
                        <div className="optionList">
                        {selectedExam.questions[qIndex].options.map((option, index) =>(
                          <FormControl sx={{ m:1, minWidth: 120, display:'flex', gap: 1,}} size='small'>
                          <TextField id="outlined-basic" label="Option" variant="standard" multiline fullWidth  value={opValue[qIndex][index]} onChange={(event) => handleOptChange(index, event)}/> 
                              <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={opSelectValue[qIndex][index]}
                                label="isCorrect"
                                onChange={(event)=>handleOptSelect(event,index)}
                                >
                                <MenuItem value={true}>true</MenuItem>
                                <MenuItem value={false}>false</MenuItem>

                              </Select>
                              </FormControl>
                                ))}
                             
                        </div>
                      </div>
                      

                      <div className="controllers">
                      <Button variant="contained" onClick={()=>handleNP('previous')}>
                          Previous
                        </Button>
                      <Button variant="contained" onClick={()=>handleNP('next')}>
                          Next
                        </Button>
                      </div>

                      
                    </div>
                 )}
                  
                  <Snackbar open={saveSuccess} autoHideDuration={6000} onClose={()=>{setSaveSuccess(false)}}>
                        <Alert onClose={()=>{setSaveSuccess(false)}} severity="success" sx={{ width: '100%' }}>
                          Questions Saved Succesfully 
                        </Alert>
                      </Snackbar>

                      <Snackbar open={saveFailure} autoHideDuration={6000} onClose={()=>{setSaveFailure(false)}}>
                        <Alert onClose={()=>{setSaveFailure(false)}} severity="error" sx={{ width: '100%' }}>
                          An Error Occcured, Save Unsuccessful
                        </Alert>
                      </Snackbar>

                {(showResult &&
                  <div className="resultCon">
                    <ArrowBack onClick={()=> setShowResult(false)} sx={{cursor:'pointer'}}/>
                    <h2>{results?.length} students took your exam</h2>

                    <Paper sx={{ width: '100%', overflow: 'hidden'}}>
                    <TableContainer sx={{ maxHeight: 300}}>
                      <Table stickyHeader aria-label="sticky table" >
                        <TableHead>
                          <TableRow>
                            <TableCell>Name Of Student</TableCell>
                            <TableCell align="right">Score</TableCell>
                            <TableCell align="right">Score&nbsp;(%)</TableCell>
                            <TableCell align="right">Time</TableCell>
                            <TableCell align="right">Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {results?.map((result) => (
                            <TableRow
                              key={subject.name}
                              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                              <TableCell component="th" scope="row">
                                {result?.name}
                              </TableCell>
                              <TableCell align="right">{result?.correctCount}</TableCell>
                              <TableCell align="right">{result?.score}</TableCell>
                              <TableCell align="right">{formatTime(result?.timestamp)}</TableCell>
                              <TableCell align="right">{formatDate(result?.timestamp)}</TableCell>
                             
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    </Paper>
                    
                  </div>

                  )}
            </div>
          </div>

        </div>

        {/* Account Card Backdrop */}

        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
        onClick={handleClose}
      >
        
        <AccountCard/>

      </Backdrop>
        
      {/* Add exam dialogue box */}

      {showAddDialouge && (
        <Dialog disableEscapeKeyDown open={Boolean(showAddDialouge)} onClose={handleDialouge}>
        <DialogTitle>Add An Exam</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: '1.5rem'}}>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
            <TextField
              required
              error = {examNameError}
              id="filled-error-helper-text"
              label="Name"
              defaultValue=""
              helperText={`${examNameError? 'Name already exists' : 'enter any name (e.g exam1)'}`}
              variant="filled"
              onChange={namecheck}
            />
            </FormControl>

            <FormControl>
            <InputLabel id="qnumber">Number of questions</InputLabel>
            <Input
            value={value}
            error={qnoerr}
            size="small"
            id='qnumber'
            onChange={handleQnoInputChange}
            onBlur={handleBlur}
            
            
            inputProps={{
              step: 5,
              min: 0,
              max: 100,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />

            {(qnoerr && 
              <p>Amount of question should be 1 - 100</p>
              )}
            </FormControl>

              <label htmlFor="select">Enter duration</label>
            <select value={duration} name='select' style={{padding: 10, border: 'none',  borderBottom: '1px solid #888'}} onChange={(e)=> setDuration(e.target.value)}>
              <option value={1800}>30 mins</option>
              <option value={3600}>1 hr</option>
              <option value={5400}>1hr 30mins</option>
              <option value={7200}>2hrs </option>
              <option value={9000}>2hrs 30mins</option>
              <option value={10800}>3hrs </option>
              <option value={12600}>3hrs 30mins</option>
              <option value={14400}>4hrs </option>
            </select>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialouge}>Cancel</Button>
          <Tooltip title="Clicking ok will add an exam draft where you can upload questions and publish" arrow>
          <Button onClick={handleAddExam}>Ok</Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
      )}

      {/* Edit exam dialogue box */}

      {showSettingsDialouge && (
        <Dialog disableEscapeKeyDown open={Boolean(showSettingsDialouge)} onClose={()=> setShowSettingsDialouge(false)}>
        <DialogTitle>Edit {selectedExam.name}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: '1.5rem'}}>
            

            <FormControl sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="qnumber">Number of questions</InputLabel>
            <Input
            value={value}
            defaultValue={selectedExam.questionNo}
            error={qnoerr}
            id='qnumber'
            onChange={handleQnoInputChange}
            onBlur={handleBlur}
            
            
            inputProps={{
              step: 5,
              min: 0,
              max: 100,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />

            {(qnoerr && 
              <p>Amount of question should be 1 - 100</p>
              )}
            </FormControl>

              <label htmlFor="select">Enter duration</label>
            <select value={duration} defaultValue={selectedExam.duration} name='select' style={{padding: 10, border: 'none',  borderBottom: '1px solid #888'}} onChange={(e)=> setDuration(e.target.value)}>
              <option value={1800}>30 mins</option>
              <option value={3600}>1 hr</option>
              <option value={5400}>1hr 30mins</option>
              <option value={7200}>2hrs </option>
              <option value={9000}>2hrs 30mins</option>
              <option value={10800}>3hrs </option>
              <option value={12600}>3hrs 30mins</option>
              <option value={14400}>4hrs </option>
            </select>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setShowSettingsDialouge(false)}>Cancel</Button>
          <Tooltip title="Clicking ok will add an exam draft where you can upload questions and publish" arrow>
          <Button onClick={handleEditExam}>Ok ooo</Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
      )}

        {/* Delete Exam dialouge Box */}

        {showDeleteDialouge && (
          <Dialog
          open={showDeleteDialouge}
          onClose={handledClose}
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogTitle>{`Are you sure you want to delete ${deleteExam.name}`}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-slide-description">
              Once deleted your uploaded questions and results in the particular exam will be permanently gone!
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRemove}>Yes</Button>
            <Button onClick={handledClose}>No</Button>
          </DialogActions>
        </Dialog>
        )}


      </div>
    </div>
    </div>
  )
}
