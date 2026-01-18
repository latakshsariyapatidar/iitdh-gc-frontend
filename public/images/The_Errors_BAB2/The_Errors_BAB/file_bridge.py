#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import Bool


class FileBridge(Node):
    def __init__(self):
        super().__init__('file_bridge')

        self.current_pen = 0.0

        self.create_subscription(
            Twist,
            '/cmd_vel',
            self.cmd_vel_callback,
            10
        )

        self.create_subscription(
            Bool,
            '/pen_cmd',
            self.pen_callback,
            10
        )

        with open('/tmp/plotter_cmd.txt', 'w') as f:
            f.write('0.0,0.0,0.0')

        self.get_logger().info('File Bridge STARTED')

    def pen_callback(self, msg):
        self.current_pen = 1.0 if msg.data else 0.0

        # Read last velocity from file (if exists)
        try:
            with open('/tmp/plotter_cmd.txt', 'r') as f:
                content = f.read().strip()
                vx, vy, _ = content.split(',')
        except:
            vx, vy = '0.0', '0.0'

        # Write immediately with updated pen
        with open('/tmp/plotter_cmd.txt', 'w') as f:
            f.write(f'{vx},{vy},{self.current_pen}')

        self.get_logger().info(f'PEN CMD → {self.current_pen}')

    def cmd_vel_callback(self, msg):
        vx = msg.angular.z
        vy = msg.linear.x
        pen = self.current_pen

        with open('/tmp/plotter_cmd.txt', 'w') as f:
            f.write(f'{vx},{vy},{pen}')

        self.get_logger().info(
            f'CMD_VEL → vx={vx:.2f}, vy={vy:.2f}, pen={pen:.1f}'
        )


def main():
    rclpy.init()
    node = FileBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
