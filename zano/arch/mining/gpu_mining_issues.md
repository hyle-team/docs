# Zano GPU mainer known issues
----------

### 1. OpenCL mining with Windows 7 and Radeon card.

OS: Windows 7 x64
Drivers: Crimson 15.12
GPU: AMD Radeon R9 380 (4GB)
CUDA Toolkit version: 10.1.105
Issue:
Zano version of Progminer built from https://github.com/hyle-team/progminer does not mine well.
Miner doesn't show any error, starts normally.
GPU load climps up to 100%, Windows hands and stops responding to user interaction.
After a minute or so GPU load drops to zero, Windows became responsible and miner show zero hashrate with no errors.

Log:


    C:\home\progminer-zano\build-opencl\progminer\Release>progminer --opencl --benchmark 1

    progminer 1.1.2-6+commit.03a591fe
    Build: windows/release/msvc

     i 21:59:40 <unknown> Selected pool localhost:0
     i 21:59:40 <unknown> Established connection to localhost:0
     i 21:59:40 <unknown> Spinning up miners...
     i 21:59:40 sim       Epoch : 0 Difficulty : 4.29 Gh
     i 21:59:40 sim       Job: 41e64f6e... block 1 localhost:0
    cl 21:59:40 cl-0      Creating buffers
    cl 21:59:40 cl-0      Using PciId : 01:00.0 Tonga OpenCL 2.0 AMD-APP (1912.5) Memory : 4.00 GB
     i 21:59:40 cl-0      Adjusting CL work multiplier for 32 CUs. Adjusted work multiplier: 29,128
     i 21:59:41 sim       Using block 1, difficulty 1
    cl 21:59:43 cl-0      Pre-compiled period 0 OpenCL ProgPow kernel
    cl 21:59:43 cl-0      Loaded period 0 progpow kernel
    cl 21:59:43 cl-0      Generating DAG + Light : 1.02 GB
    cl 21:59:43 cl-0      Creating light cache buffer, size: 16.00 MB
    cl 21:59:43 cl-0      Creating DAG buffer, size: 1024.00 MB, free: 2.98 GB
    cl 21:59:43 cl-0      Loading kernels
    cl 21:59:43 cl-0      Writing light cache buffer
    cl 21:59:45 cl-0      Pre-compiled period 1 OpenCL ProgPow kernel
     m 21:59:45 <unknown> 0:00 A0 0.00 h - cl0 0.00
    cl 21:59:50 cl-0      1024.00 MB of DAG data generated in 7,231 ms.
     m 21:59:50 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 21:59:55 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:00 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:05 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:10 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:15 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:20 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:25 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:30 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:35 <unknown> 0:00 A0 0.00 h - cl0 0.00
     m 22:00:40 <unknown> 0:01 A0 0.00 h - cl0 0.00
     i 22:00:43 main      Got interrupt ...
     i 22:00:43 main      Simulation results : Max 0.000000 h Mean 0.000000 h
     i 22:00:43 main      Disconnected from localhost:0
     i 22:00:43 main      Shutting down miners...


