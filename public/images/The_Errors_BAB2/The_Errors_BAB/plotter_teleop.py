#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import Bool, String
import sys
import termios
import tty
import select

def get_key(settings):
    tty.setraw(sys.stdin.fileno())
    rlist, _, _ = select.select([sys.stdin], [], [], 0.05)
    key = sys.stdin.read(1) if rlist else None
    termios.tcsetattr(sys.stdin, termios.TCSADRAIN, settings)
    return key

class PlotterTeleop(Node):
    def __init__(self):
        super().__init__('plotter_teleop')
        self.vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.pen_pub = self.create_publisher(Bool, '/pen_cmd', 10)
        self.cmd_pub = self.create_publisher(String, '/plotter_button', 10)
        
        self.get_logger().info("""
==============================
  PLOTTER TELEOP (WORKING)
==============================
W / S : +Y / -Y
A / D : -X / +X
P     : Pen DOWN
O     : Pen UP
T     : Triangle
Q     : Square
C     : Clear
H     : Home
SPACE : Stop
CTRL+C: Quit
==============================
""")

def main():
    rclpy.init()
    node = PlotterTeleop()
    settings = termios.tcgetattr(sys.stdin)
    
    try:
        while rclpy.ok():
            key = get_key(settings)
            
            msg = Twist()  # Reset to zeros each loop
            
            if key == 'w':
                msg.linear.x = 0.3
                node.vel_pub.publish(msg)
                node.get_logger().info('Moving +Y')
            elif key == 's':
                msg.linear.x = -0.3
                node.vel_pub.publish(msg)
                node.get_logger().info('Moving -Y')
            elif key == 'a':
                msg.angular.z = -0.3
                node.vel_pub.publish(msg)
                node.get_logger().info('Moving -X')
            elif key == 'd':
                msg.angular.z = 0.3
                node.vel_pub.publish(msg)
                node.get_logger().info('Moving +X')
            elif key == ' ':  # Space to stop
                node.vel_pub.publish(msg)  # Publishes zeros
                node.get_logger().info('STOP')
            elif key == 'p':
                node.pen_pub.publish(Bool(data=True))
                node.get_logger().info('Pen DOWN')
            elif key == 'o':
                node.pen_pub.publish(Bool(data=False))
                node.get_logger().info('Pen UP')
            elif key == 'c':
                node.cmd_pub.publish(String(data='CLEAR'))
                with open('/tmp/plotter_button.txt', 'w') as f:
                    f.write('CLEAR')
            elif key == 'h':
                node.cmd_pub.publish(String(data='HOME'))
                with open('/tmp/plotter_button.txt', 'w') as f:
                    f.write('HOME')
            elif key == 't':
                node.cmd_pub.publish(String(data='TRIANGLE'))
                with open('/tmp/plotter_button.txt', 'w') as f:
                    f.write('TRIANGLE')
            elif key == 'q':
                node.cmd_pub.publish(String(data='SQUARE'))
                with open('/tmp/plotter_button.txt', 'w') as f:
                    f.write('SQUARE')
            elif key == '\x03':  # Ctrl+C
                break
    finally:
        # Send final stop command
        msg = Twist()
        node.vel_pub.publish(msg)
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, settings)
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
