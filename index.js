const express = require('express')
const cors = require('cors')
const connect = require('./config/db');
const util = require('util')
// const { exec } = (require('child_process'));
exec = util.promisify(require('child_process').exec);
const VmInstance = require('./models/vmInstance');
const ip = require('ip');
const checkAvailability = require('./utils');

const PORT = process.env.PORT || 8080;


const app = express()

connect();

console.log(ip.address())
app.use(cors())

app.use(express.json())

app.get("/", async (req, res) => {
    try {
        let vmInstances = await VmInstance.find()
        console.log(vmInstances)
        res.send(vmInstances);
    } catch (error) {
        console.error(error)
    }

})

app.post("/", async (req, res) => {
    const { name, cpu, memory, disk, osImage, osType, numberOfVm } = req.body

    console.log(`REQUESTED RESOURCES: ${req.body} \n`)


    // GET AVAILABLE RESOURCES
    const resources = await checkAvailability(numberOfVm * cpu, numberOfVm * memory, numberOfVm * disk)
    console.log(`AVAILABLE RESOURCES: ${resources} \n`)

    // RETURN TRUE OR FALSE
    if (resources.available) {
        try {
            // let os = await OsImage.findOne({ image: osImage, type: osType }).id
            let newInstance = new VmInstance({
                name,
                cpu,
                memory,
                disk,
                osType,
                osImage
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
