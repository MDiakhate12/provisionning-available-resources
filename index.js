const express = require('express')
const cors = require('cors')
const connect = require('./config/db');
const VmInstance = require('./models/vmInstance');
const Project = require('./models/project');
const checkAvailability = require('./utils');

const PORT = process.env.PORT || 8080;

const app = express()

app.use(cors())

connect();

app.use(express.json())

app.get("/projects", async (req, res) => {
    try {
        let projects = await Project.find()
        console.log(projects)
        res.send(projects);
    } catch (error) {
        console.error(error)
    }
})

app.get("/projects/:projectId/instances", async (req, res) => {
    projectId = req.params.projectId
    try {
        let vmInstances = await VmInstance.find({ projectId })
        console.log(vmInstances)
        res.send(vmInstances);
    } catch (error) {
        console.error(error)
    }
})

app.get("/", async (req, res) => {
    try {
        let vmInstances = await VmInstance.find().populate('projectId')
        console.log(vmInstances)
        res.send(vmInstances);
    } catch (error) {
        console.error(error)
    }

})

app.post("/", async (req, res) => {

    const {
        projectName,
        applicationType,
        dependencies,
        SLA,
        environment,
        dataSize,
        connectedApplications,
        techRequirements,
        costEstimation,
        name,
        cpu,
        memory,
        disk,
        osType,
        osImage,
        numberOfVm
    } = req.body

    console.log("REQUESTED RESOURCES: ", req.body)

    console.log("\n")


    // GET AVAILABLE RESOURCES
    const resources = await checkAvailability(numberOfVm * cpu, numberOfVm * memory, numberOfVm * disk)
    console.log("AVAILABLE RESOURCES: ", resources)

    // RETURN TRUE OR FALSE
    if (resources.available) {
        try {
            // let os = await OsImage.findOne({ image: osImage, type: osType }).id

            let newProject = new Project({
                projectName,
                applicationType,
                dependencies,
                SLA,
                environment,
                dataSize,
                connectedApplications,
                techRequirements,
                costEstimation
            })

            projectId = (await newProject.save())._id

            let newInstance = new VmInstance({
                name,
                cpu,
                memory,
                disk,
                osType,
                osImage,
                projectId
            })

            newInstance = await newInstance.save()
            return res.status(201).send(newInstance)
        } catch (error) {
            console.error(error.message)
            return res.status(500).send("Server error")
        }
    } else {
        return res.send("Insufficient ressources")
    }
})

app.listen(PORT, () => {
    console.log("Listenning on port ", PORT)
})

