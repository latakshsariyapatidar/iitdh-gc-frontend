# Team Name: The Errors

## Team Members:
* Vaibhav Pagare
* Punit Kashyap
* Yash Panname
* Chekka Deva Charan 

# 1. Objective:
             The objective of this project is to design and simulate a simple 2-Degree-of-Freedom (2-DoF) planar writing mechanism using ROS 2 and CoppeliaSim.
The mechanism should mimic a basic plotter or handwriting robot capable of moving a pen tip along the X and Y axes.

Control of both axes is achieved through keyboard teleoperation, enabling real-time manual movement of the pen across the workspace. The system demonstrates the integration of ROS 2 with a simulation environment and basic control logic for planar robotic motion.

# 2 . System Overview:
                    User input is provided through a keyboard teleoperation node running in ROS 2. This node publishes motion commands as geometry_msgs/Twist messages on the /cmd_vel topic, as required by the problem statement.

## The Twist message components are mapped as follows:
 
linear.x → Motion along the Y-axis

angular.z → Motion along the X-axis

A custom ROS-to-CoppeliaSim bridge node receives these messages and writes the velocity values into a shared file. This file acts as a communication bridge between ROS 2 and CoppeliaSim.

Inside CoppeliaSim, a Lua control script continuously reads this file, converts the incoming values into joint position updates, and applies them to the two joints of the plotter. This results in smooth, real-time movement of the pen tip in the X–Y plane.

## Pen Control and Drawing

A separate ROS topic is used to control the pen state (up/down).
When the pen is down and the pen tip contacts the drawing surface, CoppeliaSim’s collision detection system is used to record and render the path of the pen, allowing the motion to be visually traced.

## Simulation and Visualization

### CoppeliaSim handles:
- Robot kinematics
- Collision detection between the pen and the paper
- Visual drawing of the pen trajectory

### ROS 2 handles:
- Keyboard teleoperation
- Command publishing
- Communication logic

This separation allows ROS 2 to act as the control layer and CoppeliaSim to act as the physics and visualization layer, exactly as required in the problem statement.

# 4. Robot Description:

The robot is a 2-Degree-of-Freedom (2-DoF) planar plotter designed to move a pen tip over a flat writing surface. It consists of two independently actuated joints that provide linear motion along the X-axis and Y-axis, allowing the end-effector to reach any point within a rectangular workspace.

## The mechanical structure is arranged such that:
- The first joint controls horizontal motion along the X-axis
- The second joint controls vertical motion along the Y-axis

At the end of the two-axis mechanism, a pen holder is mounted. This pen holder includes a **vertical (Z-axis)** actuator that raises or lowers the pen, allowing it to either touch the paper for drawing or lift up to move without marking.

The pen tip interacts with a flat paper surface placed beneath it. When the pen is lowered and makes contact with the surface, the motion of the X and Y joints traces a path, visually representing the drawing made by the robot.

The robot is simulated in CoppeliaSim, where joint positions, pen contact, and drawing are handled using built-in kinematics and collision detection. The robot receives its motion commands from ROS 2, making it possible to control the plotter in real time using external software.

# 5. Code and Software:
                     The **ROS–CoppeliaSim** interface is implemented using a **file-based** bridge. ROS 2 publishes motion and pen commands, which are written to a shared file:
/tmp/plotter_cmd.txt -this file stores vx, vy, pen (e.g. 0.25,-0.10,1) representing X-axis velocity, Y-axis velocity, and pen state. A ROS bridge node subscribes to /cmd_vel and /pen_cmd, merges the latest values, and continuously overwrites this file. The Lua controller in CoppeliaSim reads it every simulation step and applies the values directly to the plotter’s X, Y, and Z joints.

# 6. Motion and Pen control:
                          X and Y motion is obtained by integrating the velocity commands into joint positions.
The Z-axis joint controls the pen state, allowing contact with or separation from the paper.

Drawing is generated through collision detection between the pen tip and the paper surface, which is used to record and render the pen trajectory.

## Teleoperation and High-Level Commands:
                                      In addition to continuous motion control, the keyboard teleoperation node provides custom command buttons for: Home, Clear screen, Square Circle, Triangle, Star.
These commands are sent from ROS and written into a second control file:/tmp/plotter_button.txt

# 7. How to Run the Project:

## A. Prerequisites:

 To run and use this project, the following software and tools are required:
- Ubuntu 22.04 (WSL2 or native Linux)
- ROS 2 Humble
- Python 3
- CoppeliaSim (Edu or Pro edition)
- CoppeliaSim ROS-compatible environment (Lua scripting enabled)

The following ROS 2 packages must be available:
- rclpy
- geometry_msgs
- std_msgs

## B. Steps to Run:
1. Start ROS 2 environment
Open a WSL terminal and source ROS 2

2. Launch CoppeliaSim

3. Start the ROS–Coppelia bridge

4. Start the teleoperation node

5. Control the plotter

# 8. Results:

Real-time keyboard control of the plotter.
Smooth and independent X–Y motion.
Stable and responsive simulation.

[Demo Video](https://youtu.be/Bq1jBBe4_90)

# 9. Challenges Faced:
                    One of the main challenges was establishing reliable communication between ROS 2 and CoppeliaSim, as the simulator was not directly connected through ROS plugins. This was solved by implementing a file-based bridge, which required careful synchronization to avoid stale or conflicting data.

Managing simultaneous continuous motion and discrete commands was another difficulty. Velocity-based motion from /cmd_vel and event-based actions such as pen control, homing, and clearing the screen had to be handled together without overwriting each other, which required additional logic in both the ROS bridge and the Lua controller.

The pen control also presented challenges. Since pen commands were transmitted separately from motion commands, the pen state initially updated only when motion commands were received. This caused delayed or inconsistent pen behavior, which was resolved by forcing immediate file updates when pen commands arrived.

Handling collision-based drawing in CoppeliaSim was another nontrivial task. The pen had to accurately detect contact with the paper surface and record continuous trajectories without gaps or false contacts.

Finally, coordinating manual teleoperation, UI-based control, and automated shape drawing in the same simulation required careful state management to prevent conflicts between ROS input and CoppeliaSim’s internal control routines.

# 10. Limitations:
The system uses a file-based communication bridge between ROS 2 and CoppeliaSim, which is not designed for high-frequency or real-time control. While sufficient for this project, it introduces small delays and makes the system unsuitable for high-speed or highly dynamic motion.

The plotter is modeled as a 2-DoF planar mechanism, so it cannot represent out-of-plane motion or complex kinematics found in real drawing robots.

pen control buttons from UI will not work. when you will try to change the pen position from the UI the ROS2 input is given importance which is by default set to zero so initially it will never come down by UI buttons it very starting of simulation you have to use ROS2 teleop for pen control

# 11. Conclusion:

This project successfully demonstrates real-time control of a 2-DoF planar plotter using ROS 2 and CoppeliaSim.

Keyboard teleoperation allows smooth and intuitive X–Y motion of the pen within the simulation.

The file-based ROS–simulation bridge provides a simple and reliable way to integrate independent software systems.

Collision-based drawing enables realistic visualization of the pen’s motion on the virtual paper.

Overall, the system validates the feasibility of controlling and testing robotic plotters in a fully simulated ROS environment